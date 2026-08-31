import express from "express";
import request from "supertest";
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
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

let testDataSource: DataSource;

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) =>
            testDataSource.getRepository(entity),

        transaction: <T>(
            runInTransaction: (
                entityManager: EntityManager
            ) => Promise<T>
        ) => testDataSource.transaction(runInTransaction),
    },
}));

describe("StockUnitRoutes integration", () => {
    let app: express.Express;
    let db: IMemoryDb;

    beforeAll(async () => {
        db = SetupTestDb();

        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [
                StockLocation,
                StockItem,
                StockUnit,
                StockMovement,
            ],
            synchronize: true,
        });

        await testDataSource.initialize();

        const { default: stockRoutes } =
            await import("../routes/StockRoutes");

        app = express();

        app.use(express.json());
        app.use("/stocks", stockRoutes);
        app.use(errorMiddleware);
    });

    beforeEach(async () => {
        await testDataSource.query(
            `DELETE FROM "stock_movement"`
        );

        await testDataSource.query(
            `DELETE FROM "stock_unit"`
        );

        await testDataSource.query(
            `DELETE FROM "stock_item"`
        );

        await testDataSource.query(
            `DELETE FROM "stock_location"`
        );
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("GET /stocks/units retourne les stock units d'un item", async () => {
        const response = await request(app)
            .get("/stocks/units")
            .query({ itemId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("POST /stocks/units crée une stock unit", async () => {
        const location = await testDataSource
            .getRepository(StockLocation)
            .save({
                label: "Cuisine",
            });

        const item = await testDataSource
            .getRepository(StockItem)
            .save({
                label: "Pâtes",
                barcode: null,
                defaultUnit: "paquet",
                imageUrl: null,
            });

        const response = await request(app)
            .post("/stocks/units")
            .send({
                itemId: item.id,
                locationId: location.id,
                quantity: 2,
                unit: "paquet",
            });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeTypeOf("number");
        expect(response.body.itemId).toBe(item.id);
        expect(response.body.locationId).toBe(location.id);
        expect(response.body.quantity).toBe(2);
        expect(response.body.unit).toBe("paquet");
    });

    it("PATCH /stocks/units/:id met à jour une stock unit", async () => {
        const location = await testDataSource
            .getRepository(StockLocation)
            .save({
                label: "Cuisine",
            });

        const secondLocation = await testDataSource
            .getRepository(StockLocation)
            .save({
                label: "Cave",
            });

        const item = await testDataSource
            .getRepository(StockItem)
            .save({
                label: "Pâtes",
                barcode: null,
                defaultUnit: "paquet",
                imageUrl: null,
            });

        const unit = await testDataSource
            .getRepository(StockUnit)
            .save({
                itemId: item.id,
                locationId: location.id,
                quantity: 1,
                unit: "paquet",
                expirationDate: null,
            });

        const response = await request(app)
            .patch(`/stocks/units/${unit.id}`)
            .send({
                itemId: item.id,
                locationId: secondLocation.id,
                quantity: 5,
                unit: "kg",
            });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(unit.id);
        expect(response.body.locationId).toBe(secondLocation.id);
        expect(response.body.quantity).toBe(5);
        expect(response.body.unit).toBe("kg");
    });

    it("DELETE /stocks/units/:id supprime logiquement une stock unit", async () => {
        const location = await testDataSource
            .getRepository(StockLocation)
            .save({
                label: "Cuisine",
            });

        const item = await testDataSource
            .getRepository(StockItem)
            .save({
                label: "Pâtes",
                barcode: null,
                defaultUnit: "paquet",
                imageUrl: null,
            });

        const unit = await testDataSource
            .getRepository(StockUnit)
            .save({
                itemId: item.id,
                locationId: location.id,
                quantity: 1,
                unit: "paquet",
                expirationDate: null,
            });

        const response = await request(app)
            .delete(`/stocks/units/${unit.id}`);

        expect(response.status).toBe(204);

        const deletedUnit = await testDataSource
            .getRepository(StockUnit)
            .findOne({
                where: {
                    id: unit.id,
                },
                withDeleted: true,
            });

        expect(deletedUnit).not.toBeNull();
        expect(deletedUnit?.deletedAt).not.toBeNull();
    });

    it("DELETE /stocks/units/:id retourne 404 si la stock unit n'existe pas", async () => {
        const response = await request(app)
            .delete("/stocks/units/999999");

        expect(response.status).toBe(404);
    });
});
