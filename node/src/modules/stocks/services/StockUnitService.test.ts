import { DataSource, EntityManager } from "typeorm";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { IMemoryDb } from "pg-mem";
import SetupTestDb from "../../../tests/SetupTests";
import StockUnitService from "./StockUnitService";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

let testDataSource: DataSource;

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        get manager() {
            return testDataSource.manager;
        },

        getRepository: <T>(entity: new () => T) =>
            testDataSource.getRepository(entity),

        transaction: <T>(
            runInTransaction: (entityManager: EntityManager) => Promise<T>
        ) => testDataSource.transaction(runInTransaction),
    },
}));

vi.mock("../../core/services/UserXpService", () => ({
    default: class UserXpService {
        addXPForUser = vi.fn().mockResolvedValue(undefined);
    },
}));

describe("StockUnitService", () => {
    let db: IMemoryDb;
    let service: StockUnitService;
    let locationId: number;
    let itemId: number;

    beforeAll(async () => {
        db = SetupTestDb();

        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [StockLocation, StockItem, StockUnit, StockMovement],
            synchronize: true,
        });

        await testDataSource.initialize();
    });

    beforeEach(async () => {
        await testDataSource.query(`DELETE FROM "stock_movement"`);
        await testDataSource.query(`DELETE FROM "stock_unit"`);
        await testDataSource.query(`DELETE FROM "stock_item"`);
        await testDataSource.query(`DELETE FROM "stock_location"`);

        service = new StockUnitService();

        const location = await testDataSource
            .getRepository(StockLocation)
            .save({ label: "Cellier" });

        locationId = location.id;

        const item = await testDataSource
            .getRepository(StockItem)
            .save({
                label: "Lait",
                barcode: null,
                defaultUnit: "bouteilles",
                imageUrl: null,
            });

        itemId = item.id;
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    describe("create", () => {
        it("creates a stock unit and an IN movement", async () => {
            const result = await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 6,
                    unit: "bouteilles",
                    expirationDate: "2026-09-15",
                },
                42
            );

            expect(result).toMatchObject({
                itemId,
                locationId,
                quantity: 6,
                unit: "bouteilles",
                expirationDate: "2026-09-15",
            });

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find();

            expect(movements).toHaveLength(1);
            expect(movements[0]).toMatchObject({
                unitId: result.id,
                itemId,
                itemLabel: "Lait",
                locationId,
                locationLabel: "Cellier",
                quantity: 6,
                unit: "bouteilles",
                type: "IN",
            });
        });
    });

    describe("update", () => {
        it("updates the stock unit and its IN movement", async () => {
            const created = await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 6,
                    unit: "bouteilles",
                },
                42
            );

            const result = await service.update(created.id, {
                itemId,
                locationId,
                quantity: 10,
                unit: "litres",
                expirationDate: "2026-10-01",
            });

            expect(result).toMatchObject({
                id: created.id,
                quantity: 10,
                unit: "litres",
                expirationDate: "2026-10-01",
            });

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find();

            expect(movements).toHaveLength(1);
            expect(movements[0]).toMatchObject({
                unitId: created.id,
                quantity: 10,
                unit: "litres",
                type: "IN",
            });
        });

        it("does not create a second movement when updating", async () => {
            const created = await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 6,
                    unit: "bouteilles",
                },
                42
            );

            await service.update(created.id, {
                itemId,
                locationId,
                quantity: 8,
                unit: "bouteilles",
            });

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find();

            expect(movements).toHaveLength(1);
        });

        it("throws when the stock unit does not exist", async () => {
            await expect(
                service.update(999, {
                    itemId,
                    locationId,
                    quantity: 8,
                    unit: "bouteilles",
                })
            ).rejects.toThrow();
        });
    });

    describe("delete", () => {
        it("creates a DELETE movement and removes the stock unit", async () => {
            const created = await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 3,
                    unit: "bouteilles",
                },
                42
            );

            await service.delete(created.id);

            const stockUnit = await testDataSource
                .getRepository(StockUnit)
                .findOneBy({ id: created.id });

            expect(stockUnit).toBeNull();

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find({
                    order: {
                        id: "ASC",
                    },
                });

            expect(movements).toHaveLength(2);
            expect(movements[1]).toMatchObject({
                unitId: created.id,
                type: "DELETE",
                quantity: 3,
            });
        });
    });

    describe("takeUnit", () => {
        it("creates an OUT movement and removes the stock unit", async () => {
            const created = await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 3,
                    unit: "bouteilles",
                },
                42
            );

            await service.takeUnit(created.id, 42);

            const stockUnit = await testDataSource
                .getRepository(StockUnit)
                .findOneBy({ id: created.id });

            expect(stockUnit).toBeNull();

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find({
                    order: {
                        id: "ASC",
                    },
                });

            expect(movements).toHaveLength(2);
            expect(movements[1]).toMatchObject({
                unitId: created.id,
                type: "OUT",
                quantity: 3,
            });
        });

        it("throws when the stock unit does not exist", async () => {
            await expect(
                service.takeUnit(999, 42)
            ).rejects.toThrow();
        });
    });

    describe("getStockUnitsByItemId", () => {
        it("returns stock units for an item", async () => {
            await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 2,
                    unit: "bouteilles",
                },
                42
            );

            const result = await service.getStockUnitsByItemId(itemId);

            expect(result).toHaveLength(1);
            expect(result[0].itemId).toBe(itemId);
        });

        it("returns all stock units when no item id is provided", async () => {
            await service.create(
                {
                    itemId,
                    locationId,
                    quantity: 2,
                    unit: "bouteilles",
                },
                42
            );

            const result = await service.getStockUnitsByItemId();

            expect(result).toHaveLength(1);
        });
    });
});
