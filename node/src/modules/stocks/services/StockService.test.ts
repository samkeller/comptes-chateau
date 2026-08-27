import { DataSource, EntityManager } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import SetupTestDb from "../../../tests/SetupTests";
import { IMemoryDb } from "pg-mem";
import StockService from "./StockService";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";

let testDataSource: DataSource;

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => testDataSource.getRepository(entity),
        transaction: <T>(runInTransaction: (entityManager: EntityManager) => Promise<T>) =>
            testDataSource.transaction(runInTransaction),
    },
}));

describe("StockService", () => {
    let db: IMemoryDb;
    let service: StockService;
    let seededLocationId: number;

    beforeAll(async () => {
        db = SetupTestDb();
        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [StockLocation, StockItem, StockMovement],
            synchronize: true,
        });

        await testDataSource.initialize();
    });

    beforeEach(async () => {
        await testDataSource.query(`DELETE FROM "stock_movement"`);
        await testDataSource.query(`DELETE FROM "stock_item"`);
        await testDataSource.query(`DELETE FROM "stock_location"`);
        service = new StockService();

        const location = await testDataSource.getRepository(StockLocation).save({
            label: "Placard cuisine",
        });

        seededLocationId = location.id;
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("creates an initial IN movement when an item starts with quantity", async () => {
        const item = await service.createItem({
            label: "Pâtes",
            barcode: "1234567890123",
            unit: "paquet",
            locationId: seededLocationId,
            initialQuantity: 6,
            source: "manual",
        });

        expect(item.currentQuantity).toBe(6);

        const movements = await service.getItemHistory(item.id);
        expect(movements).toHaveLength(1);
        expect(movements[0]).toMatchObject({
            type: "IN",
            quantity: 6,
            source: "manual",
        });
    });

    it("records movements and updates the current quantity in the same flow", async () => {
        const item = await service.createItem({
            label: "Confiture",
            unit: "pot",
            locationId: seededLocationId,
            initialQuantity: 2,
        });

        const updatedItem = await service.recordMovement(item.id, {
            type: "OUT",
            quantity: 1,
            source: "manual",
        });

        expect(updatedItem.currentQuantity).toBe(1);

        const movements = await service.getItemHistory(item.id);
        expect(movements.map((movement) => movement.type)).toEqual(["OUT", "IN"]);
        expect(movements.map((movement) => movement.quantity)).toEqual([1, 2]);
    });

    it("rejects stock outputs that would make the quantity negative", async () => {
        const item = await service.createItem({
            label: "Doliprane",
            unit: "boîte",
            locationId: seededLocationId,
            initialQuantity: 1,
        });

        await expect(service.recordMovement(item.id, {
            type: "OUT",
            quantity: 2,
            source: "manual",
        })).rejects.toMatchObject({
            code: "STOCK_NEGATIVE_QUANTITY",
        });

        const reloadedItem = await testDataSource.getRepository(StockItem).findOneByOrFail({ id: item.id });
        expect(reloadedItem.currentQuantity).toBe(1);

        const movementCount = await testDataSource.getRepository(StockMovement).count({
            where: {
                itemId: item.id,
            },
        });
        expect(movementCount).toBe(1);
    });

    it("creates an item with zero initial quantity without recording a movement", async () => {
        const item = await service.createItem({
            label: "Sel",
            unit: "boîte",
            locationId: seededLocationId,
            initialQuantity: 0,
        });

        expect(item.currentQuantity).toBe(0);

        const movements = await service.getItemHistory(item.id);
        expect(movements).toHaveLength(0);
    });

    it("throws when creating an item for a non-existent location", async () => {
        await expect(service.createItem({
            label: "Farine",
            unit: "kg",
            locationId: 99999,
            initialQuantity: 1,
        })).rejects.toMatchObject({
            code: "STOCK_LOCATION_NOT_FOUND",
        });
    });

    it("throws when recording a movement for a non-existent item", async () => {
        await expect(service.recordMovement(99999, {
            type: "IN",
            quantity: 1,
            source: "manual",
        })).rejects.toMatchObject({
            code: "STOCK_ITEM_NOT_FOUND",
        });
    });

    it("throws when fetching history for a non-existent item", async () => {
        await expect(service.getItemHistory(99999)).rejects.toMatchObject({
            code: "STOCK_ITEM_NOT_FOUND",
        });
    });

    it("updates a location label", async () => {
        const updated = await service.updateLocation(seededLocationId, { label: "  Nouveau label  " });

        expect(updated.label).toBe("Nouveau label");
    });

    it("throws when updating a non-existent location", async () => {
        await expect(service.updateLocation(99999, { label: "X" })).rejects.toMatchObject({
            code: "STOCK_LOCATION_NOT_FOUND",
        });
    });

    it("throws when deleting a non-existent location", async () => {
        await expect(service.deleteLocation(99999)).rejects.toMatchObject({
            code: "STOCK_LOCATION_NOT_FOUND",
        });
    });

    it("throws when deleting a location that still has items", async () => {
        await service.createItem({
            label: "Poivre",
            unit: "pot",
            locationId: seededLocationId,
            initialQuantity: 0,
        });

        await expect(service.deleteLocation(seededLocationId)).rejects.toMatchObject({
            code: "STOCK_LOCATION_NOT_EMPTY",
        });
    });

    it("soft-deletes a location when it is empty", async () => {
        await service.deleteLocation(seededLocationId);

        const locations = await service.listLocations();
        expect(locations.find((l) => l.id === seededLocationId)).toBeUndefined();
    });

    it("updates an item and reflects changes immediately", async () => {
        const item = await service.createItem({
            label: "Riz",
            unit: "kg",
            locationId: seededLocationId,
            initialQuantity: 1,
        });

        const newLocation = await testDataSource.getRepository(StockLocation).save({ label: "Cave" });

        const updated = await service.updateItem(item.id, {
            label: "  Riz basmati  ",
            unit: "kg",
            locationId: newLocation.id,
        });

        expect(updated.label).toBe("Riz basmati");
        expect(updated.location.id).toBe(newLocation.id);
    });

    it("throws when updating a non-existent item", async () => {
        await expect(service.updateItem(99999, {
            label: "X",
            unit: "kg",
            locationId: seededLocationId,
        })).rejects.toMatchObject({
            code: "STOCK_ITEM_NOT_FOUND",
        });
    });

    it("throws when updating an item to a non-existent location", async () => {
        const item = await service.createItem({
            label: "Sucre",
            unit: "kg",
            locationId: seededLocationId,
            initialQuantity: 0,
        });

        await expect(service.updateItem(item.id, {
            label: "Sucre",
            unit: "kg",
            locationId: 99999,
        })).rejects.toMatchObject({
            code: "STOCK_LOCATION_NOT_FOUND",
        });
    });

    it("soft-deletes an item", async () => {
        const item = await service.createItem({
            label: "Café",
            unit: "paquet",
            locationId: seededLocationId,
            initialQuantity: 0,
        });

        await service.deleteItem(item.id);

        const items = await service.listItems(seededLocationId);
        expect(items.find((i) => i.id === item.id)).toBeUndefined();
    });

    it("throws when deleting a non-existent item", async () => {
        await expect(service.deleteItem(99999)).rejects.toMatchObject({
            code: "STOCK_ITEM_NOT_FOUND",
        });
    });
});
