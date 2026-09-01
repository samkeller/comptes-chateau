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
import StockMovementService from "./StockMovementService";
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

describe("StockMovementService", () => {
    let db: IMemoryDb;
    let service: StockMovementService;

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

        service = new StockMovementService();
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    describe("createMovement", () => {
        it("creates a movement", async () => {
            const result = await service.createMovement({
                unitId: 1,
                itemId: 2,
                itemLabel: "Lait",
                locationId: 3,
                locationLabel: "Cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "IN",
            });

            expect(result).toMatchObject({
                unitId: 1,
                itemId: 2,
                itemLabel: "Lait",
                locationId: 3,
                locationLabel: "Cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "IN",
            });

            expect(result.id).toBeDefined();
        });
    });

    describe("updateMovement", () => {
        it("updates the IN movement associated with a stock unit", async () => {
            await service.createMovement({
                unitId: 1,
                itemId: 2,
                itemLabel: "Ancien lait",
                locationId: 3,
                locationLabel: "Ancien cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "IN",
            });

            const stockUnit = {
                id: 1,
                itemId: 4,
                locationId: 5,
                quantity: 10,
                unit: "litres",
                item: {
                    label: "Nouveau lait",
                },
                location: {
                    label: "Nouveau cellier",
                },
            } as StockUnit;

            const result = await service.updateMovement(stockUnit);

            expect(result).toMatchObject({
                unitId: 1,
                itemId: 4,
                itemLabel: "Nouveau lait",
                locationId: 5,
                locationLabel: "Nouveau cellier",
                quantity: 10,
                unit: "litres",
                type: "IN",
            });
        });

        it("does not modify the movement type", async () => {
            await service.createMovement({
                unitId: 1,
                itemId: 2,
                itemLabel: "Lait",
                locationId: 3,
                locationLabel: "Cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "IN",
            });

            const stockUnit = {
                id: 1,
                itemId: 2,
                locationId: 3,
                quantity: 5,
                unit: "bouteilles",
                item: {
                    label: "Lait",
                },
                location: {
                    label: "Cellier",
                },
            } as StockUnit;

            const result = await service.updateMovement(stockUnit);

            expect(result.type).toBe("IN");
        });

        it("throws when the IN movement does not exist", async () => {
            const stockUnit = {
                id: 999,
                itemId: 2,
                locationId: 3,
                quantity: 5,
                unit: "bouteilles",
            } as StockUnit;

            await expect(
                service.updateMovement(stockUnit)
            ).rejects.toThrow("Stock movement not found");
        });
    });

    describe("uniqueness", () => {
        it("allows one movement of each type for a unit", async () => {
            await service.createMovement({
                unitId: 1,
                itemId: 2,
                itemLabel: "Lait",
                locationId: 3,
                locationLabel: "Cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "IN",
            });

            await service.createMovement({
                unitId: 1,
                itemId: 2,
                itemLabel: "Lait",
                locationId: 3,
                locationLabel: "Cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "OUT",
            });

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find();

            expect(movements).toHaveLength(2);
        });

        it("does not allow two IN movements for the same unit", async () => {
            await service.createMovement({
                unitId: 1,
                itemId: 2,
                itemLabel: "Lait",
                locationId: 3,
                locationLabel: "Cellier",
                quantity: 2,
                unit: "bouteilles",
                type: "IN",
            });

            await expect(
                service.createMovement({
                    unitId: 1,
                    itemId: 2,
                    itemLabel: "Lait",
                    locationId: 3,
                    locationLabel: "Cellier",
                    quantity: 5,
                    unit: "bouteilles",
                    type: "IN",
                })
            ).rejects.toThrow();
        });
    });
});
