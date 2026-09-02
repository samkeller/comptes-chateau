import { AppDataSource } from "../../../db/dataSource";
import { notFound, conflict } from "../../../utils/AppError";
import type { EntityManager, Repository } from "typeorm";
import type { StockUnitCreateDto, StockUnitDto } from "@chocosous/shared";
import { toStockUnitDto } from "../mappers/StockUnitMapper";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";
import UserXpService from "../../core/services/UserXpService";
import StockMovementService from "./StockMovementService";

const DEFAULT_MOVEMENT_SOURCE = "manual";

export default class StockUnitService {
    private readonly stockUnitRepo: Repository<StockUnit>;
    private readonly userXpService: UserXpService;
    private readonly stockMovementService: StockMovementService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockUnitRepo = em.getRepository(StockUnit);
        this.userXpService = new UserXpService(em);
        this.stockMovementService = new StockMovementService(em);
    }
    /**
     * Récupère toutes les unités de stock d'un stock item.
     * @param itemId L'identifiant du stock item.
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
     * Crée une nouvelle stock unit.
     * L'id est généré par la base de données.
     */
    async create(body: StockUnitCreateDto, connectedUserId: number): Promise<StockUnitDto> {
        const stockUnit = this.stockUnitRepo.create({
            itemId: body.itemId,
            locationId: body.locationId,
            quantity: body.quantity,
            unit: body.unit,
            expirationDate: body.expirationDate ?? null,
        });

        const savedStockUnit = await this.stockUnitRepo.save(stockUnit);

        // Ajout XP utilisateur
        await this.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_CREATED");

        return toStockUnitDto(savedStockUnit);
    }

    /**
     * Met à jour une stock unit existante.
     */
    async update(
        unitId: number,
        body: StockUnitCreateDto
    ): Promise<StockUnitDto> {
        const stockUnit = await this.stockUnitRepo.findOne({
            where: {
                id: unitId,
            },
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

        await this.stockUnitRepo.save(stockUnit);

        await this.stockMovementService.updateMovement(stockUnit);

        return toStockUnitDto(stockUnit);
    }

    /**
     * Supprime une stock unit.
     *
     * Suppression logique grâce à @DeleteDateColumn.
     */
    async delete(unitId: number): Promise<void> {
        await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new StockUnitService(entityManager);

            const stockUnit = await transactionService.stockUnitRepo.findOne({
                where: {
                    id: unitId,
                },
                relations: { // Chargement pour stockMovementService
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

            await transactionService.stockMovementService.createMovement({
                itemLabel: stockUnit.item.label,
                locationLabel: stockUnit.location.label,
                locationId: stockUnit.locationId,
                unit: stockUnit.unit,
                itemId: stockUnit.itemId,
                unitId: stockUnit.id,
                type: "OUT",
                quantity: stockUnit.quantity,
            });

            await transactionService.stockUnitRepo.remove(stockUnit);
        });
    }

    /**
     * Retire une unite complete du stock en journalisant uniquement un mouvement `OUT`.
     * La disponibilite est deduite de l'historique: une unite ayant deja un `OUT` n'apparait plus dans le stock courant.
     */
    async takeUnit(
        unitId: number,
        connectedUserId: number
    ) {
        await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new StockUnitService(entityManager);

            const unit = await transactionService.stockUnitRepo.findOne({
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

            unit.quantity -= 1;

            await transactionService.stockMovementService.createMovement({
                itemLabel: unit.item.label,
                locationLabel: unit.location.label,
                locationId: unit.locationId,
                unit: unit.unit,
                itemId: unit.itemId,
                unitId: unit.id,
                type: "OUT",
                quantity: unit.quantity,
            });

            await transactionService.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_TAKE");

            if(unit?.quantity > 0) {
                await transactionService.stockUnitRepo.save(unit);
            } else {
                await transactionService.stockUnitRepo.delete(unit.id);
            }
        });

    }

    private normalizeOptionalString(value: string | null | undefined): string | null {
        if (typeof value !== "string") {
            return null;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    private normalizeSource(value: string | null | undefined): string {
        return this.normalizeOptionalString(value)?.toLowerCase() ?? DEFAULT_MOVEMENT_SOURCE;
    }
}
