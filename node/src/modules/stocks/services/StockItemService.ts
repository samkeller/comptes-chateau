import { AppDataSource } from "../../../db/dataSource";
import { In, IsNull, Not, type EntityManager, type Repository } from "typeorm";
import type { ParsedQs } from "qs";
import { StockItem } from "../entities/StockItem";
import type { StockEntryItemDto, StockItemWithLotsDto, StockProductSuggestionDto, StockExpiryState } from "@chocosous/shared";
import { barcodeVariants, normalizeBarcode } from "@chocosous/shared";
import { toStockItemWithLotsDto } from "../mappers/StockItemMapper";
import { getExpiryBounds, toStockLots } from "../mappers/StockLotMapper";
import { badRequest, notFound } from "../../../utils/AppError";
import StockUnitService from "./StockUnitService";
import TableQueryMapper from "../../../utils/tableQuery/TableQueryMapper";
import TableQueryParser from "../../../utils/tableQuery/TableQueryParser";
import { createStockItemsTableQueryConfig } from "../query/stockItemsTableQueryConfig";

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

    /** Liste les produits selon les filtres/tri PrimeReact et agrège leurs exemplaires en lots côté serveur. */
    async search(query: ParsedQs, includeEmpty = false, now: Date = new Date()): Promise<StockItemWithLotsDto[]> {
        const bounds = getExpiryBounds(now);
        const parserOptions = {
            pagination: false as const,
            allowedSortFields: new Set(["label", "brand"]),
            allowedFilterFields: new Set(["global", "label", "brand", "barcode", "locationId", "expiryState"]),
        };
        const parsed = TableQueryParser.parse(query, parserOptions);
        const locationFilter = parsed.filters.find((filter) => filter.field === "locationId");
        const locationId = locationFilter?.type === "simple" ? Number(locationFilter.value) : null;
        const expiryFilter = parsed.filters.find((filter) => filter.field === "expiryState");
        const expiryState = expiryFilter?.type === "simple" ? expiryFilter.value as StockExpiryState : null;
        const config = createStockItemsTableQueryConfig({ bounds, includeEmpty, locationId, expiryState });
        const queryBuilder = this.stockItemRepo.createQueryBuilder("item")
            .leftJoin("item.units", "filterUnit")
            .distinct(true);

        if (!includeEmpty) {
            queryBuilder.andWhere('"filterUnit"."itemId" IS NOT NULL');
        }
        TableQueryMapper.applyFilters(queryBuilder, parsed.filters, config.filterHandlers);
        TableQueryMapper.applySort(queryBuilder, parsed.sort, config.sortHandlers, config.defaultSort);

        const items = await queryBuilder.getMany();
        const units = await this.stockUnitService.findByItemIds(items.map((item) => item.id), locationId ?? undefined);

        const unitsByItem = new Map<number, typeof units>();
        for (const unit of units) {
            const itemUnits = unitsByItem.get(unit.itemId);
            if (itemUnits) itemUnits.push(unit);
            else unitsByItem.set(unit.itemId, [unit]);
        }

        const result = items
            .map((item) => {
                const lots = toStockLots(unitsByItem.get(item.id) ?? [], bounds)
                    .filter((lot) => expiryState === null || lot.expiryState === expiryState);
                return toStockItemWithLotsDto(item, lots);
            });
        if (parsed.sort) return result;
        return result.sort((a, b) => {
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
