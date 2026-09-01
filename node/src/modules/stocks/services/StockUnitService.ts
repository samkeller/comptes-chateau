import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { notFound } from "../../../utils/AppError";
import { StockUnitDto, toStockUnitDto } from "../dto/ToStockUnitDto";
import { StockUnitCreateDto } from "../dto/StockUnitCreateDto";
import { StockUnit } from "../entities/StockUnit";
import UserXpService from "../../core/services/UserXpService";
import StockMovementService from "./StockMovementService";

export default class StockUnitService {
    private readonly stockUnitRepo: Repository<StockUnit>;
    private readonly userXpService: UserXpService;
    private readonly movementService: StockMovementService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockUnitRepo = em.getRepository(StockUnit);
        this.userXpService = new UserXpService(em);
        this.movementService = new StockMovementService(em);
    }

    /**
     * Récupère toutes les unités de stock d'un stock item.
     *
     * @param itemId L'identifiant du stock item.
     * @returns Les unités de stock correspondantes.
     */
    async getStockUnitsByItemId(itemId?: number): Promise<StockUnitDto[]> {
        const result = await this.stockUnitRepo.find({
            where: {
                ...(itemId ? { itemId } : {}),
            },
            relations: {
                item: true,
                location: true
            },
            order: {
                expirationDate: "ASC",
                createdAt: "ASC",
            }
        });
        return result.map(toStockUnitDto);
    }

    /**
     * Crée une nouvelle unité de stock.
     */
    async create(body: StockUnitCreateDto, connectedUserId: number): Promise<StockUnitDto> {
        return AppDataSource.transaction(async (em) => {
            const service = new StockUnitService(em);

            const stockUnit = service.stockUnitRepo.create({
                itemId: body.itemId,
                locationId: body.locationId,
                quantity: body.quantity,
                unit: body.unit,
                expirationDate: body.expirationDate ?? null,
            });

            const savedStockUnit = await service.stockUnitRepo.save(stockUnit);

            const result = await service.stockUnitRepo.findOne({
                where: {
                    id: savedStockUnit.id,
                },
                relations: {
                    item: true,
                    location: true,
                },
            });

            if (!result) {
                throw notFound(
                    "STOCK_UNIT_NOT_FOUND",
                    "Unite de stock introuvable"
                );
            }

            await service.movementService.createMovement({
                unitId: result.id,
                unit: result.unit,
                quantity: result.quantity,
                itemId: result.itemId,
                itemLabel: result.item.label,
                locationId: result.locationId,
                locationLabel: result.location.label,
                type: "IN",
            });

            // Ajout XP utilisateur
            await service.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_CREATED");

            return toStockUnitDto(result);
        });
    }

    /**
     * Met à jour une unité de stock existante.
     */
    async update(
        unitId: number,
        body: StockUnitCreateDto
    ): Promise<StockUnitDto> {
        return AppDataSource.transaction(async (em) => {
            const service = new StockUnitService(em);

            const stockUnit = await service.stockUnitRepo.findOne({
                where: {
                    id: unitId,
                },
                relations: {
                    item: true,
                    location: true,
                } // Nécessaire pour mettre à jour le mouvement de stock.
            });

            if (!stockUnit) {
                throw notFound(
                    "STOCK_UNIT_NOT_FOUND",
                    "Unite de stock introuvable"
                );
            }

            stockUnit.itemId = body.itemId;
            stockUnit.locationId = body.locationId;
            stockUnit.quantity = body.quantity;
            stockUnit.unit = body.unit;
            stockUnit.expirationDate = body.expirationDate ?? null;
            
            const updatedStockUnit = await service.stockUnitRepo.save(stockUnit);

            await service.movementService.updateMovement(updatedStockUnit);

            return toStockUnitDto(updatedStockUnit);
        })
    }

    /**
     * Supprime une unité de stock.
     */
    async delete(unitId: number): Promise<void> {
        await AppDataSource.transaction(async (em) => {
            const service = new StockUnitService(em);

            const stockUnit = await service.stockUnitRepo.findOne({
                where: {
                    id: unitId,
                },
                relations: {
                    item: true,
                    location: true,
                },
            });

            if (!stockUnit) {
                throw notFound(
                    "STOCK_UNIT_NOT_FOUND",
                    "Unite de stock introuvable"
                );
            }

            await service.movementService.createMovement({
                unitId: stockUnit.id,
                unit: stockUnit.unit,
                quantity: stockUnit.quantity,
                itemId: stockUnit.itemId,
                itemLabel: stockUnit.item.label,
                locationId: stockUnit.locationId,
                locationLabel: stockUnit.location.label,
                type: "DELETE",
            });

            await service.stockUnitRepo.remove(stockUnit);
        });
    }

    /**
     * Retire une unité complète du stock.
     *
     * L'opération est transactionnelle :
     * - lecture de l'unité ;
     * - création du mouvement `OUT` ;
     * - attribution de l'XP ;
     * - suppression de l'unité du stock actif.
     *
     * @param unitId Identifiant de l'unité à retirer.
     * @param connectedUserId Utilisateur ayant consommé l'unité.
     */
    async takeUnit(
        unitId: number,
        connectedUserId: number
    ): Promise<void> {
        await AppDataSource.transaction(async (em) => {
            const service = new StockUnitService(em);

            const unit = await service.stockUnitRepo.findOne({
                where: {
                    id: unitId,
                },
                relations: {
                    item: true,
                    location: true,
                },
            });

            if (!unit) {
                throw notFound(
                    "STOCK_UNIT_NOT_FOUND",
                    "Unite de stock introuvable"
                );
            }

            await service.movementService.createMovement({
                unitId: unit.id,
                unit: unit.unit,
                quantity: unit.quantity,
                itemId: unit.itemId,
                itemLabel: unit.item.label,
                locationId: unit.locationId,
                locationLabel: unit.location.label,
                type: "OUT",
            });

            await service.userXpService.addXPForUser(
                connectedUserId,
                "STOCK_UNIT_TAKE"
            );

            await service.stockUnitRepo.remove(unit);
        });
    }
}