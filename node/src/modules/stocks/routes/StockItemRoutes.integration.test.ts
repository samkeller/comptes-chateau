import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createTestApp } from "../../../tests/testApp";

describe("StockItemRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: stockRoutes } =
            await import("../routes/StockRoutes");

        app = createTestApp("/stocks", stockRoutes);
    });

    it("GET /stocks/items retourne les stock items", async () => {
        const response = await request(app)
            .get("/stocks/items");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("POST /stocks/items crée un stock item", async () => {
        const response = await request(app)
            .post("/stocks/items")
            .send({
                label: "Pâtes",
                defaultUnit: "paquet",
                units: [],
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            label: "Pâtes",
            defaultUnit: "paquet",
            stockUnitsCount: 0,
        });
    });
});
