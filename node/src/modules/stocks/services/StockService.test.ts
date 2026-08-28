import { DataSource, EntityManager } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import SetupTestDb from "../../../tests/SetupTests";
import { IMemoryDb } from "pg-mem";
import StockUnitService from "./StockUnitService";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

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
    let service: StockUnitService;
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

        service = new StockUnitService();
        const location = await testDataSource.getRepository(StockLocation).save({ label: "Cellier" });
        locationId = location.id;
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("stores intake as a physical unit and an IN movement", async () => {
        const units = await service.intake({
            locationId,
            lines: [{
                label: "Sauce tomate",
                quantity: 1,
                unit: "pot",
                expirationDate: "2027-01-31",
            }],
        });

        expect(units).toHaveLength(1);
        expect(units[0]).toMatchObject({
            quantity: 1,
            unit: "pot",
            expirationDate: "2027-01-31",
            locationId,
        });
        expect(units[0].item.label).toBe("Sauce tomate");

        const history = await service.getItemHistory(units[0].itemId);
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            type: "IN",
            unitId: units[0].id,
            toLocationId: locationId,
            quantity: 1,
        });
    });

    it("stores take as an OUT movement and hides the unit from available stock", async () => {
        const [unit] = await service.intake({
            locationId,
            lines: [{
                label: "Farine",
                quantity: 1,
                unit: "sac",
            }],
        });

        await service.takeUnit(unit.id, { source: "manual" });

        expect(await service.getAll(locationId)).toEqual([]);
        await expect(service.takeUnit(unit.id, { source: "manual" })).rejects.toMatchObject({
            code: "STOCK_UNIT_ALREADY_TAKEN",
        });

        const history = await service.getItemHistory(unit.itemId);
        expect(history.map((movement) => movement.type)).toEqual(["OUT", "IN"]);
        expect(history[0]).toMatchObject({
            unitId: unit.id,
            fromLocationId: locationId,
        });
    });
});
