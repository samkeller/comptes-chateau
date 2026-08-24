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
});
