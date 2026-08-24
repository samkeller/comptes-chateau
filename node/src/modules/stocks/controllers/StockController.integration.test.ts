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
            entities: [StockLocation, StockItem, StockMovement],
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
        await testDataSource.synchronize(true);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("creates locations and items, then exposes item history", async () => {
        const locationResponse = await request(app)
            .post("/stocks/locations")
            .send({ label: "Garage" });

        expect(locationResponse.status).toBe(201);
        const locationId = locationResponse.body.id as number;

        const itemResponse = await request(app)
            .post("/stocks/items")
            .send({
                label: "Eau pétillante",
                unit: "bouteille",
                locationId,
                initialQuantity: 6,
                source: "manual",
            });

        expect(itemResponse.status).toBe(201);
        expect(itemResponse.body.currentQuantity).toBe(6);
        expect(itemResponse.body.location.id).toBe(locationId);

        const listResponse = await request(app)
            .get("/stocks/items")
            .query({ locationId: String(locationId) });

        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toHaveLength(1);

        const itemId = itemResponse.body.id as number;
        const movementResponse = await request(app)
            .post(`/stocks/items/${itemId}/movements`)
            .send({
                type: "OUT",
                quantity: 2,
                source: "manual",
            });

        expect(movementResponse.status).toBe(201);
        expect(movementResponse.body.currentQuantity).toBe(4);

        const historyResponse = await request(app)
            .get(`/stocks/items/${itemId}/history`);

        expect(historyResponse.status).toBe(200);
        expect(historyResponse.body).toHaveLength(2);
        expect(historyResponse.body[0]).toMatchObject({
            type: "OUT",
            quantity: 2,
        });
        expect(historyResponse.body[1]).toMatchObject({
            type: "IN",
            quantity: 6,
        });
    });

    it("rejects invalid payloads and inconsistent deletions", async () => {
        const invalidLocationResponse = await request(app)
            .post("/stocks/locations")
            .send({ label: "" });

        expect(invalidLocationResponse.status).toBe(400);
        expect(invalidLocationResponse.body.code).toBe("VALIDATION_ERROR");

        const locationResponse = await request(app)
            .post("/stocks/locations")
            .send({ label: "Pharmacie" });
        const locationId = locationResponse.body.id as number;

        const itemResponse = await request(app)
            .post("/stocks/items")
            .send({
                label: "Doliprane",
                unit: "boîte",
                locationId,
                initialQuantity: 1,
            });

        const deleteLocationResponse = await request(app)
            .delete(`/stocks/locations/${locationId}`);

        expect(deleteLocationResponse.status).toBe(409);
        expect(deleteLocationResponse.body.code).toBe("STOCK_LOCATION_NOT_EMPTY");

        const negativeMovementResponse = await request(app)
            .post(`/stocks/items/${itemResponse.body.id}/movements`)
            .send({
                type: "OUT",
                quantity: 3,
                source: "manual",
            });

        expect(negativeMovementResponse.status).toBe(400);
        expect(negativeMovementResponse.body.code).toBe("STOCK_NEGATIVE_QUANTITY");
    });
});
