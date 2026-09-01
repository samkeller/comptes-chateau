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
import StockItemService from "./StockItemService";
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

describe("StockItemService", () => {
    let db: IMemoryDb;
    let service: StockItemService;
    let locationId: number;

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

        service = new StockItemService();

        const location = await testDataSource
            .getRepository(StockLocation)
            .save({ label: "Cellier" });

        locationId = location.id;
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    describe("create", () => {
        it("creates a stock item", async () => {
            const result = await service.create(
                {
                    label: "Lait",
                    barcode: "123456",
                    defaultUnit: "bouteilles",
                },
                42
            );

            expect(result).toMatchObject({
                label: "Lait",
                barcode: "123456",
                defaultUnit: "bouteilles",
            });

            expect(result.id).toBeDefined();
        });
    });

    describe("update", () => {
        it("updates a stock item", async () => {
            const created = await service.create(
                {
                    label: "Lait",
                    defaultUnit: "bouteilles",
                },
                42
            );

            const result = await service.update(created.id, {
                label: "Lait entier",
                barcode: "123",
                defaultUnit: "litres",
                imageUrl: "image.jpg",
            });

            expect(result).toMatchObject({
                id: created.id,
                label: "Lait entier",
                barcode: "123",
                defaultUnit: "litres",
                imageUrl: "image.jpg",
            });
        });

        it("throws when the stock item does not exist", async () => {
            await expect(
                service.update(999, {
                    label: "Lait",
                    defaultUnit: "bouteilles",
                })
            ).rejects.toThrow();
        });

        it("does not create stock movements", async () => {
            const created = await service.create(
                {
                    label: "Lait",
                    defaultUnit: "bouteilles",
                },
                42
            );

            await service.update(created.id, {
                label: "Lait entier",
                defaultUnit: "bouteilles",
            });

            const movements = await testDataSource
                .getRepository(StockMovement)
                .find();

            expect(movements).toHaveLength(0);
        });
    });

    describe("getAll", () => {
        it("returns all stock items", async () => {
            await service.create(
                {
                    label: "Lait",
                    defaultUnit: "bouteilles",
                },
                42
            );

            await service.create(
                {
                    label: "Pain",
                    defaultUnit: "unités",
                },
                42
            );

            const result = await service.getAll({});

            expect(result).toHaveLength(2);
        });

        it("filters items by location", async () => {
            const itemWithStock = await service.create(
                {
                    label: "Lait",
                    defaultUnit: "bouteilles",
                },
                42
            );

            await service.create(
                {
                    label: "Pain",
                    defaultUnit: "unités",
                },
                42
            );

            await testDataSource.getRepository(StockUnit).save({
                itemId: itemWithStock.id,
                locationId,
                quantity: 2,
                unit: "bouteilles",
                expirationDate: null,
            });

            const result = await service.getAll({ locationId });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(itemWithStock.id);
        });

        it("does not return an item that has no stock in the requested location", async () => {
            const item = await service.create(
                {
                    label: "Lait",
                    defaultUnit: "bouteilles",
                    units: []
                },
                42
            );

            const otherLocation = await testDataSource
                .getRepository(StockLocation)
                .save({ label: "Frigo" });

            await testDataSource.getRepository(StockUnit).save({
                itemId: item.id,
                locationId: otherLocation.id,
                quantity: 2,
                unit: "bouteilles",
                expirationDate: null,
            });

            const result = await service.getAll({ locationId });

            expect(result).toHaveLength(0);
        });
    });
});
