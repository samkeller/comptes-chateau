import express from "express";
import request from "supertest";
import { DataSource, EntityManager } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { IMemoryDb } from "pg-mem";
import SetupTestDb from "../../../tests/SetupTests";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";
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

describe("StockRoutes integration", () => {
    let app: express.Express;
    let db: IMemoryDb;

    beforeAll(async () => {
        db = SetupTestDb();
        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [StockLocation, StockItem, StockUnit, StockMovement],
            synchronize: true,
        });

        await testDataSource.initialize();

        const { default: stockRoutes } = await import("../routes/StockRoutes");
        app = express();
        app.use(express.json());
        app.use("/stocks", stockRoutes);
        app.use(errorMiddleware);
    });

    beforeEach(async () => {
        await testDataSource.query(`DELETE FROM "stock_movement"`);
        await testDataSource.query(`DELETE FROM "stock_unit"`);
        await testDataSource.query(`DELETE FROM "stock_item"`);
        await testDataSource.query(`DELETE FROM "stock_location"`);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("supports the minimal stock flow through HTTP", async () => {
        const locationResponse = await request(app)
            .post("/stocks/locations")
            .send({ label: "Cellier" });

        expect(locationResponse.status).toBe(201);
        const locationId = locationResponse.body.id as number;

        const intakeResponse = await request(app)
            .post("/stocks/intake")
            .send({
                locationId,
                lines: [{
                    label: "Doliprane",
                    quantity: 1,
                    unit: "boite",
                    expirationDate: "2027-01-31",
                }],
            });

        expect(intakeResponse.status).toBe(201);
        expect(intakeResponse.body).toHaveLength(1);
        const unitId = intakeResponse.body[0].id as number;
        const itemId = intakeResponse.body[0].itemId as number;

        const unitsResponse = await request(app)
            .get("/stocks/units")
            .query({ locationId: String(locationId) });

        expect(unitsResponse.status).toBe(200);
        expect(unitsResponse.body).toHaveLength(1);

        const takeResponse = await request(app)
            .post(`/stocks/units/${unitId}/take`)
            .send({ source: "manual" });

        expect(takeResponse.status).toBe(201);

        const remainingUnitsResponse = await request(app)
            .get("/stocks/units")
            .query({ locationId: String(locationId) });

        expect(remainingUnitsResponse.status).toBe(200);
        expect(remainingUnitsResponse.body).toEqual([]);

        const historyResponse = await request(app)
            .get(`/stocks/items/${itemId}/history`);

        expect(historyResponse.status).toBe(200);
        expect(historyResponse.body.map((movement: { type: string }) => movement.type)).toEqual(["OUT", "IN"]);
    });
});
