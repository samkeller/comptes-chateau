import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { notFound } from "../../../utils/AppError";
import { StockItemDto, toStockItemDto } from "../dto/ToStockItemDto";
import { StockItemsQueryDto } from "../dto/StockUnitsQueryDto";
import { StockItemCreateDto } from "../dto/StockItemCreateDto";
import { StockItem } from "../entities/StockItem";
import UserXpService from "../../core/services/UserXpService";

export default class StockItemService {
    private readonly stockItemRepo: Repository<StockItem>;
    private readonly userXpService: UserXpService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockItemRepo = em.getRepository(StockItem);
        this.userXpService = new UserXpService(em);
    }

    /**
     * Récupère tous les stock items.
     *
     * @param query Filtres de recherche.
     * @returns Les stock items correspondants.
     */
    async getAll(
        query: StockItemsQueryDto
    ): Promise<StockItemDto[]> {
        const { locationId } = query

        let items = await this.stockItemRepo.find({
            where: {
                ...(locationId && {
                    units: {
                        locationId,
                    },
                }),
            },
            relations: {
                units: true,
            },
            select: {
                units: {
                    id: true,
                    locationId: true,
                },
            },
        });

        // Si un filtre de localisation est fourni, on ne garde que les items ayant au moins une unité dans cette localisation
        if(locationId) {
            items = items.filter(item => item.units.some(unit => unit.locationId === locationId));
        }

        return items.map(toStockItemDto);
    }

    async create(body: StockItemCreateDto, connectedUserId: number): Promise<StockItemDto> {
        return AppDataSource.transaction(async (em) => {
            const service = new StockItemService(em);
            const stockItem = service.stockItemRepo.create({
                label: body.label,
                barcode: body.barcode ?? null,
                defaultUnit: body.defaultUnit,
                imageUrl: body.imageUrl ?? null,
            });

            const savedStockItem = await service.stockItemRepo.save(stockItem);

            await service.userXpService.addXPForUser(
                connectedUserId,
                "STOCK_ITEM_CREATED"
            );

            return toStockItemDto(savedStockItem);
        });
    }

    /**
     * Met à jour un stock item existant.
     *
     * La modification des informations descriptives d'un item ne génère
     * pas de mouvement de stock.
     *
     * @param itemId Identifiant du stock item.
     * @param body Nouvelles données.
     * @returns Le stock item mis à jour.
     */
    async update(
        itemId: number,
        body: StockItemCreateDto
    ): Promise<StockItemDto> {
        const stockItem = await this.stockItemRepo.findOne({
            where: {
                id: itemId,
            },
        });

        if (!stockItem) {
            throw notFound(
                "STOCK_ITEM_NOT_FOUND",
                "Stock item introuvable"
            );
        }

        stockItem.label = body.label;
        stockItem.barcode = body.barcode ?? null;
        stockItem.defaultUnit = body.defaultUnit;
        stockItem.imageUrl = body.imageUrl ?? null;

        const updatedStockItem = await this.stockItemRepo.save(stockItem);

        return toStockItemDto(updatedStockItem);
    }
}