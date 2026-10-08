import { AppDataSource } from "../../../db/dataSource";
import { ILike, In, IsNull, Not, type EntityManager, type FindOptionsWhere, type Repository } from "typeorm";
import { StockItem } from "../entities/StockItem";
import type { StockEntryItemDto, StockItemsQueryDto, StockItemWithLotsDto, StockProductSuggestionDto } from "@chocosous/shared";
import { barcodeVariants, normalizeBarcode } from "@chocosous/shared";
import { toStockItemWithLotsDto } from "../mappers/StockItemMapper";
import { getExpiryBounds, toStockLots } from "../mappers/StockLotMapper";
import { notFound } from "../../../utils/AppError";
import StockUnitService from "./StockUnitService";

/** Échappe les jokers SQL d'une recherche utilisateur. */
function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Catalogue des produits. Un produit n'est jamais supprimé : épuisé, il reste retrouvable.
 */
export default class StockItemService {
    private readonly stockItemRepo: Repository<StockItem>;
    private readonly stockUnitService: StockUnitService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockItemRepo = em.getRepository(StockItem);
        this.stockUnitService = new StockUnitService(em);
    }

    /**
     * Liste les produits avec leurs lots en une requête produits + une requête exemplaires.
     * - `search` : nom, marque ou code-barres ;
     * - `locationId` : ne garde que les lots de ce lieu ;
     * - `expiryState` : produits ayant au moins un lot dans cet état ;
     * - `includeEmpty` : inclut les produits sans lot (épuisés, ou absents du lieu filtré).
     * Tri : prochaine échéance d'abord, puis nom.
     */
    async search(query: StockItemsQueryDto, now: Date = new Date()): Promise<StockItemWithLotsDto[]> {
        const search = query.search?.trim();
        let where: FindOptionsWhere<StockItem>[] | undefined;
        if (search) {
            const pattern = `%${escapeLike(search)}%`;
            where = [{ label: ILike(pattern) }, { brand: ILike(pattern) }];
            const barcode = normalizeBarcode(search);
            if (barcode) where.push({ barcode: In(barcodeVariants(barcode)) });
        }

        const items = await this.stockItemRepo.find({ where, order: { label: "ASC", id: "ASC" } });
        const bounds = getExpiryBounds(now);
        const units = await this.stockUnitService.findByItemIds(items.map((item) => item.id), query.locationId);

        const unitsByItem = new Map<number, typeof units>();
        for (const unit of units) {
            unitsByItem.set(unit.itemId, [...(unitsByItem.get(unit.itemId) ?? []), unit]);
        }

        return items
            .map((item) => toStockItemWithLotsDto(item, toStockLots(unitsByItem.get(item.id) ?? [], bounds)))
            .filter((item) => (query.includeEmpty || item.lots.length > 0)
                && (!query.expiryState || item.lots.some((lot) => lot.expiryState === query.expiryState)))
            .sort((a, b) => {
                if (a.nextStockUnitExpiration !== b.nextStockUnitExpiration) {
                    if (a.nextStockUnitExpiration === null) return 1;
                    if (b.nextStockUnitExpiration === null) return -1;
                    return a.nextStockUnitExpiration < b.nextStockUnitExpiration ? -1 : 1;
                }
                return a.label.localeCompare(b.label, "fr");
            });
    }

    /** Produit et tous ses lots (tous lieux). */
    async getWithLots(id: number, now: Date = new Date()): Promise<StockItemWithLotsDto> {
        const item = await this.findByIdOrThrow(id);
        const units = await this.stockUnitService.findByItemIds([id]);
        return toStockItemWithLotsDto(item, toStockLots(units, getExpiryBounds(now)));
    }

    /**
     * Retrouve un produit par code-barres, y compris sous une forme historique non normalisée.
     * Les codes-barres ne sont pas uniques : privilégie le dernier produit créé, puis son ID.
     */
    async findByBarcode(barcode: string): Promise<StockItem | null> {
        const variants = barcodeVariants(barcode);
        if (variants.length === 0) return null;
        return this.stockItemRepo.findOne({
            where: { barcode: In(variants) },
            order: { createdAt: "DESC", id: "DESC" },
        });
    }

    async findByIdOrThrow(id: number): Promise<StockItem> {
        const item = await this.stockItemRepo.findOneBy({ id });
        if (!item) {
            throw notFound("STOCK_ITEM_NOT_FOUND", "Produit introuvable");
        }
        return item;
    }

    /**
     * Crée ou met à jour un produit à partir d'une saisie.
     * En modification, un champ facultatif absent (`undefined`) est conservé, `null` l'efface.
     * @returns le produit enregistré et s'il vient d'être créé.
     */
    async save(dto: StockEntryItemDto): Promise<{ item: StockItem; created: boolean }> {
        const item = dto.id !== undefined
            ? await this.findByIdOrThrow(dto.id)
            : this.stockItemRepo.create({ barcode: null, brand: null, imageUrl: null });

        item.label = dto.label;
        item.defaultUnit = dto.defaultUnit;
        if (dto.barcode !== undefined) item.barcode = dto.barcode;
        if (dto.brand !== undefined) item.brand = dto.brand || null;
        if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;

        return { item: await this.stockItemRepo.save(item), created: dto.id === undefined };
    }

    /** Produits ayant un code-barres (synchronisation OpenFoodFacts). */
    async findAllWithBarcode(): Promise<StockItem[]> {
        return this.stockItemRepo.find({ where: { barcode: Not(IsNull()) }, order: { id: "ASC" } });
    }

    /**
     * Normalise le code-barres d'un produit historique. Idempotent.
     * @returns `true` si le produit a été modifié.
     */
    async normalizeBarcode(item: StockItem): Promise<boolean> {
        const normalized = item.barcode ? normalizeBarcode(item.barcode) : null;
        if (!normalized || normalized === item.barcode) return false;
        await this.stockItemRepo.update(item.id, { barcode: normalized });
        item.barcode = normalized;
        return true;
    }

    /**
     * Complète un produit avec une suggestion OpenFoodFacts sans jamais écraser une valeur saisie.
     * @returns `true` si le produit a été modifié.
     */
    async enrichFromSuggestion(item: StockItem, suggestion: StockProductSuggestionDto): Promise<boolean> {
        const changes: Partial<Pick<StockItem, "brand" | "imageUrl">> = {};
        if (!item.brand && suggestion.brand) changes.brand = suggestion.brand;
        if (!item.imageUrl && suggestion.imageUrl) changes.imageUrl = suggestion.imageUrl;
        if (Object.keys(changes).length === 0) return false;
        await this.stockItemRepo.update(item.id, changes);
        Object.assign(item, changes);
        return true;
    }
}
