import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { testDataSource } from "../../../tests/testDbSetup";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockUnit } from "../entities/StockUnit";
import { User } from "../../core/entities/User";
import { createTestApp } from "../../../tests/testApp";

describe("StockUnitRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: stockUnitRoutes } = await import("./StockUnitRoutes");
        app = createTestApp("/stocks/units", stockUnitRoutes, 1);
    });

    it("GET /stocks/units retourne les stock units d'un item", async () => {
        const response = await request(app)
            .get("/stocks/units")
            .query({ itemId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("POST /stocks/units crée une stock unit", async () => {
        await testDataSource.getRepository(User).save({
            id: 1,
            username: "stock-user",
            avatar: "001-tiger.png",
            totalXp: 0,
            passwordHash: "hash",
        });

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
