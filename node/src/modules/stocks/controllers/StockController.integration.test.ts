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

});
