import { AppDataSource } from "../../../db/dataSource";
import { badRequest, conflict, notFound } from "../../../utils/AppError";
import type {
    CreateStockItemDto,
    CreateStockLocationDto,
    RecordStockMovementDto,
    StockItemDto,
    StockLocationDto,
    StockMovementDto,
    UpdateStockItemDto,
    UpdateStockLocationDto,
} from "@chocosous/shared";
import { toStockItemDto } from "../dto/StockItemDto";
import { toStockLocationDto } from "../dto/StockLocationDto";
import { toStockMovementDto } from "../dto/StockMovementDto";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";

const DEFAULT_MOVEMENT_SOURCE = "manual";

export default class StockService {
    private readonly stockLocationRepo = AppDataSource.getRepository(StockLocation);
    private readonly stockItemRepo = AppDataSource.getRepository(StockItem);
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

        const savedLocation = await this.stockLocationRepo.save(location);
        return toStockLocationDto(savedLocation);
    }

    async updateLocation(id: number, dto: UpdateStockLocationDto): Promise<StockLocationDto> {
        const location = await this.stockLocationRepo.findOneBy({ id });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        location.label = dto.label.trim();
        const savedLocation = await this.stockLocationRepo.save(location);
        return toStockLocationDto(savedLocation);
    }

    async deleteLocation(id: number): Promise<void> {
        const location = await this.stockLocationRepo.findOneBy({ id });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        const itemsCount = await this.stockItemRepo.count({
            where: {
                locationId: id,
            },
        });

        if (itemsCount > 0) {
            throw conflict("STOCK_LOCATION_NOT_EMPTY", "Impossible de supprimer un lieu contenant encore des produits");
        }

        await this.stockLocationRepo.softDelete({ id });
    }

    async listItems(locationId?: number): Promise<StockItemDto[]> {
        const items = await this.stockItemRepo.find({
            where: locationId ? { locationId } : undefined,
            relations: {
                location: true,
            },
            order: {
                label: "ASC",
            },
        });

        return items.map(toStockItemDto);
    }

    async createItem(dto: CreateStockItemDto): Promise<StockItemDto> {
        let createdItemId = 0;

        await AppDataSource.transaction(async (entityManager) => {
            const locationRepo = entityManager.getRepository(StockLocation);
            const itemRepo = entityManager.getRepository(StockItem);
            const movementRepo = entityManager.getRepository(StockMovement);

            const location = await locationRepo.findOneBy({ id: dto.locationId });
            if (!location) {
                throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
            }

            const initialQuantity = dto.initialQuantity ?? 0;
            const item = itemRepo.create({
                label: dto.label.trim(),
                barcode: this.normalizeOptionalString(dto.barcode),
                unit: dto.unit.trim(),
                locationId: location.id,
                currentQuantity: initialQuantity,
                expirationDate: this.normalizeOptionalString(dto.expirationDate),
                imageUrl: this.normalizeOptionalString(dto.imageUrl),
            });

            const savedItem = await itemRepo.save(item);
            createdItemId = savedItem.id;

            if (initialQuantity > 0) {
                const movement = movementRepo.create({
                    itemId: savedItem.id,
                    type: "IN",
                    quantity: initialQuantity,
                    occurredAt: dto.occurredAt ?? new Date(),
                    source: this.normalizeSource(dto.source),
                });

                await movementRepo.save(movement);
            }
        });

        return this.loadItemOrThrow(createdItemId);
    }

    async updateItem(id: number, dto: UpdateStockItemDto): Promise<StockItemDto> {
        const item = await this.stockItemRepo.findOne({
            where: { id },
            relations: {
                location: true,
            },
        });

        if (!item) {
            throw notFound("STOCK_ITEM_NOT_FOUND", "Produit en stock introuvable");
        }

        const location = await this.stockLocationRepo.findOneBy({ id: dto.locationId });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        item.label = dto.label.trim();
        item.barcode = this.normalizeOptionalString(dto.barcode);
        item.unit = dto.unit.trim();
        item.locationId = location.id;
        item.location = location;
        item.expirationDate = this.normalizeOptionalString(dto.expirationDate);
        item.imageUrl = this.normalizeOptionalString(dto.imageUrl);

        await this.stockItemRepo.save(item);
        return this.loadItemOrThrow(id);
    }

    async deleteItem(id: number): Promise<void> {
        const item = await this.stockItemRepo.findOneBy({ id });
        if (!item) {
            throw notFound("STOCK_ITEM_NOT_FOUND", "Produit en stock introuvable");
        }

        await this.stockItemRepo.softDelete({ id });
    }

    async recordMovement(itemId: number, dto: RecordStockMovementDto): Promise<StockItemDto> {
        await AppDataSource.transaction(async (entityManager) => {
            const itemRepo = entityManager.getRepository(StockItem);
            const movementRepo = entityManager.getRepository(StockMovement);

            const item = await itemRepo.findOneBy({ id: itemId });
            if (!item) {
                throw notFound("STOCK_ITEM_NOT_FOUND", "Produit en stock introuvable");
            }

            const nextQuantity = dto.type === "IN"
                ? item.currentQuantity + dto.quantity
                : item.currentQuantity - dto.quantity;

            if (nextQuantity < 0) {
                throw badRequest("STOCK_NEGATIVE_QUANTITY", "Impossible de retirer davantage que la quantité disponible");
            }

            item.currentQuantity = nextQuantity;
            await itemRepo.save(item);

            const movement = movementRepo.create({
                itemId: item.id,
                type: dto.type,
                quantity: dto.quantity,
                occurredAt: dto.occurredAt ?? new Date(),
                source: this.normalizeSource(dto.source),
            });

            await movementRepo.save(movement);
        });

        return this.loadItemOrThrow(itemId);
    }

    async getItemHistory(itemId: number): Promise<StockMovementDto[]> {
        const item = await this.stockItemRepo.findOneBy({ id: itemId });
        if (!item) {
            throw notFound("STOCK_ITEM_NOT_FOUND", "Produit en stock introuvable");
        }

        const movements = await this.stockMovementRepo.find({
            where: {
                itemId,
            },
            order: {
                occurredAt: "DESC",
                createdAt: "DESC",
            },
        });

        return movements.map(toStockMovementDto);
    }

    private async loadItemOrThrow(id: number): Promise<StockItemDto> {
        const item = await this.stockItemRepo.findOne({
            where: {
                id,
            },
            relations: {
                location: true,
            },
        });

        if (!item) {
            throw notFound("STOCK_ITEM_NOT_FOUND", "Produit en stock introuvable");
        }

        return toStockItemDto(item);
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
