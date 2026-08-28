import { Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { conflict, notFound } from "../../../utils/AppError";
import { CreateStockLocationDto, UpdateStockLocationDto } from "../dto/CreateStockLocationDto";
import { StockIntakeDto, StockIntakeLineDto } from "../dto/StockIntakeDto";
import { StockLocationDto, toStockLocationDto } from "../dto/StockLocationDto";
import { StockMovementDto, toStockMovementDto } from "../dto/StockMovementDto";
import { StockUnitDto, toStockUnitDto } from "../dto/StockUnitDto";
import { TakeStockUnitDto } from "../dto/TakeStockUnitDto";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

const DEFAULT_MOVEMENT_SOURCE = "manual";

export default class StockService {
    private readonly stockLocationRepo = AppDataSource.getRepository(StockLocation);
    private readonly stockItemRepo = AppDataSource.getRepository(StockItem);
    private readonly stockUnitRepo = AppDataSource.getRepository(StockUnit);
    private readonly stockMovementRepo = AppDataSource.getRepository(StockMovement);

    async listLocations(): Promise<StockLocationDto[]> {
        const locations = await this.stockLocationRepo.find({
            order: {
                label: "ASC",
            },
        });

        return locations.map(toStockLocationDto);
    }

    async createLocation(dto: CreateStockLocationDto): Promise<StockLocationDto> {
        const location = this.stockLocationRepo.create({
            label: dto.label.trim(),
        });

        return toStockLocationDto(await this.stockLocationRepo.save(location));
    }

    async updateLocation(id: number, dto: UpdateStockLocationDto): Promise<StockLocationDto> {
        const location = await this.stockLocationRepo.findOneBy({ id });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        location.label = dto.label.trim();
        return toStockLocationDto(await this.stockLocationRepo.save(location));
    }

    async deleteLocation(id: number): Promise<void> {
        const location = await this.stockLocationRepo.findOneBy({ id });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        const availableUnits = await this.listAvailableUnits(id);
        if (availableUnits.length > 0) {
            throw conflict("STOCK_LOCATION_NOT_EMPTY", "Impossible de supprimer un lieu contenant encore des produits disponibles");
        }

        await this.stockLocationRepo.softDelete({ id });
    }

    async listAvailableUnits(locationId?: number): Promise<StockUnitDto[]> {
        const units = await this.stockUnitRepo.find({
            where: locationId ? { locationId } : undefined,
            relations: {
                item: true,
                location: true,
            },
            order: {
                expirationDate: "ASC",
                createdAt: "ASC",
            },
        });

        const takenUnitIds = await this.findTakenUnitIds(units.map((unit) => unit.id));
        return units
            .filter((unit) => !takenUnitIds.has(unit.id))
            .map(toStockUnitDto);
    }

    /**
     * Ajoute les produits ranges en une seule transaction: chaque ligne cree ou reutilise une fiche produit,
     * cree une unite physique, puis journalise l'entree via un mouvement `IN`.
     */
    async intake(dto: StockIntakeDto): Promise<StockUnitDto[]> {
        const createdUnitIds: number[] = [];

        await AppDataSource.transaction(async (entityManager) => {
            const locationRepo = entityManager.getRepository(StockLocation);
            const itemRepo = entityManager.getRepository(StockItem);
            const unitRepo = entityManager.getRepository(StockUnit);
            const movementRepo = entityManager.getRepository(StockMovement);

            const location = await locationRepo.findOneBy({ id: dto.locationId });
            if (!location) {
                throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
            }

            for (const line of dto.lines) {
                const item = await this.findOrCreateItemForIntake(itemRepo, line);
                const unit = await unitRepo.save(unitRepo.create({
                    itemId: item.id,
                    locationId: location.id,
                    quantity: line.quantity,
                    unit: line.unit.trim(),
                    expirationDate: this.normalizeOptionalString(line.expirationDate),
                    label: this.normalizeOptionalString(line.unitLabel),
                }));

                await movementRepo.save(movementRepo.create({
                    itemId: item.id,
                    unitId: unit.id,
                    toLocationId: location.id,
                    type: "IN",
                    quantity: unit.quantity,
                    occurredAt: dto.occurredAt ?? new Date(),
                    source: this.normalizeSource(dto.source),
                }));

                createdUnitIds.push(unit.id);
            }
        });

        return this.loadUnitsByIds(createdUnitIds);
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

    async getItemHistory(itemId: number): Promise<StockMovementDto[]> {
        const item = await this.stockItemRepo.findOneBy({ id: itemId });
        if (!item) {
            throw notFound("STOCK_ITEM_NOT_FOUND", "Produit en stock introuvable");
        }

        const movements = await this.stockMovementRepo.find({
            where: { itemId },
            order: {
                occurredAt: "DESC",
                createdAt: "DESC",
            },
        });

        return movements.map(toStockMovementDto);
    }

    private async findTakenUnitIds(unitIds: number[]): Promise<Set<number>> {
        if (unitIds.length === 0) {
            return new Set();
        }

        const movements = await this.stockMovementRepo.find({
            where: {
                type: "OUT",
            },
            select: {
                unitId: true,
            },
        });

        return new Set(movements
            .map((movement) => movement.unitId)
            .filter((unitId): unitId is number => unitId !== null && unitIds.includes(unitId)));
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

    private async findOrCreateItemForIntake(
        itemRepo: Repository<StockItem>,
        line: StockIntakeLineDto
    ): Promise<StockItem> {
        const label = line.label.trim();
        const existingItem = await itemRepo.findOne({
            where: {
                label,
            },
        });

        if (existingItem) {
            if (!existingItem.barcode) {
                existingItem.barcode = this.normalizeOptionalString(line.barcode);
            }
            if (!existingItem.imageUrl) {
                existingItem.imageUrl = this.normalizeOptionalString(line.imageUrl);
            }
            return itemRepo.save(existingItem);
        }

        return itemRepo.save(itemRepo.create({
            label,
            barcode: this.normalizeOptionalString(line.barcode),
            defaultUnit: line.unit.trim(),
            imageUrl: this.normalizeOptionalString(line.imageUrl),
        }));
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
