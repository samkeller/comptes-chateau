import { AppDataSource } from "../../../db/dataSource";
import { notFound, conflict } from "../../../utils/AppError";
import type { StockUnitCreateDto, StockUnitDto } from "@chocosous/shared";
import { toStockUnitDto } from "../mappers/StockUnitMapper";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";
import UserXpService from "../../core/services/UserXpService";

const DEFAULT_MOVEMENT_SOURCE = "manual";

export default class StockUnitService {
    private readonly stockUnitRepo = AppDataSource.getRepository(StockUnit);
    private readonly userXpService = new UserXpService();

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

        const result = await this.stockUnitRepo.findOne({
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

        // Ajout XP utilisateur
        await this.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_CREATED"); 

        return toStockUnitDto(result);
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

        const updatedStockUnit = await this.stockUnitRepo.findOne({
            where: {
                id: unitId,
            },
            relations: {
                item: true,
                location: true,
            },
        });

        if (!updatedStockUnit) {
            throw notFound(
                "STOCK_UNIT_NOT_FOUND",
                "Unite de stock introuvable"
            );
        }

        return toStockUnitDto(updatedStockUnit);
    }

    /**
     * Supprime une stock unit.
     *
     * Suppression logique grâce à @DeleteDateColumn.
     */
    async delete(unitId: number): Promise<void> {
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

        await this.stockUnitRepo.softRemove(stockUnit);
    }

    /**
     * Retire une unite complete du stock en journalisant uniquement un mouvement `OUT`.
     * La disponibilite est deduite de l'historique: une unite ayant deja un `OUT` n'apparait plus dans le stock courant.
     */
    async takeUnit(
        unitId: number,
        connectedUserId: number
    ): Promise<StockUnitDto> {
        let takenUnit: StockUnit | null = null;

        await AppDataSource.transaction(async (entityManager) => {
            const unitRepo = entityManager.getRepository(StockUnit);
            const movementRepo = entityManager.getRepository(StockMovement);

            const unit = await unitRepo.findOne({
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

            const alreadyTaken = await movementRepo.exists({
                where: {
                    unitId: unit.id,
                    type: "OUT",
                },
            });

            if (alreadyTaken) {
                throw conflict(
                    "STOCK_UNIT_ALREADY_TAKEN",
                    "Cette unite n'est plus disponible en stock"
                );
            }

            await movementRepo.save(
                movementRepo.create({
                    itemId: unit.itemId,
                    unitId: unit.id,
                    fromLocationId: unit.locationId,
                    type: "OUT",
                    quantity: unit.quantity,
                    occurredAt: new Date(),
                    source: "manual",
                })
            );

            takenUnit = unit;
        });

        if (!takenUnit) {
            throw notFound(
                "STOCK_UNIT_NOT_FOUND",
                "Unite de stock introuvable"
            );
        }

        await this.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_TAKE");

        return toStockUnitDto(takenUnit);
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
