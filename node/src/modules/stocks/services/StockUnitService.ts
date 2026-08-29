import { Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { conflict, notFound } from "../../../utils/AppError";
import { StockUnitDto, toStockUnitDto } from "../dto/StockUnitDto";
import { TakeStockUnitDto } from "../dto/TakeStockUnitDto";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

const DEFAULT_MOVEMENT_SOURCE = "manual";

export default class StockUnitService {
    private readonly stockUnitRepo = AppDataSource.getRepository(StockUnit);

    /**
     * Récupères toutes les unités de stocks en fonction des filtres.
     * @param itemId 
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
    * Retire une unite complete du stock en journalisant uniquement un mouvement `OUT`.
    * La disponibilite est deduite de l'historique: une unite ayant deja un `OUT` n'apparait plus dans le stock courant.
    */
    async takeUnit(unitId: number, dto: TakeStockUnitDto): Promise<StockUnitDto> {
        let takenUnit: StockUnit | null = null;

        await AppDataSource.transaction(async (entityManager) => {
            const unitRepo = entityManager.getRepository(StockUnit);
            const movementRepo = entityManager.getRepository(StockMovement);

            const unit = await unitRepo.findOne({
                where: { id: unitId },
                relations: {
                    item: true,
                    location: true,
                },
            });

            if (!unit) {
                throw notFound("STOCK_UNIT_NOT_FOUND", "Unite de stock introuvable");
            }

            const alreadyTaken = await movementRepo.exists({
                where: {
                    unitId: unit.id,
                    type: "OUT",
                },
            });

            if (alreadyTaken) {
                throw conflict("STOCK_UNIT_ALREADY_TAKEN", "Cette unite n'est plus disponible en stock");
            }

            await movementRepo.save(movementRepo.create({
                itemId: unit.itemId,
                unitId: unit.id,
                fromLocationId: unit.locationId,
                type: "OUT",
                quantity: unit.quantity,
                occurredAt: dto.occurredAt ?? new Date(),
                source: this.normalizeSource(dto.source),
            }));

            takenUnit = unit;
        });

        if (!takenUnit) {
            throw notFound("STOCK_UNIT_NOT_FOUND", "Unite de stock introuvable");
        }

        return toStockUnitDto(takenUnit);
    }

    private async loadUnitsByIds(unitIds: number[]): Promise<StockUnitDto[]> {
        if (unitIds.length === 0) {
            return [];
        }

        const units = await this.stockUnitRepo.find({
            where: unitIds.map((id) => ({ id })),
            relations: {
                item: true,
                location: true,
            },
            order: {
                createdAt: "ASC",
            },
        });

        return units.map(toStockUnitDto);
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
