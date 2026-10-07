import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../../../tests/testApp";

describe("StockItemRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: stockRoutes } =
            await import("../routes/StockRoutes");

        app = createTestApp("/stocks", stockRoutes);
    });

    afterEach(() => vi.unstubAllGlobals());

    it.each(["1234567", "123456789012345", "1234567a", "1234%205678"])(
        "rejects an invalid barcode before calling OFF: %s",
        async (barcode) => {
            const fetchMock = vi.fn();
            vi.stubGlobal("fetch", fetchMock);
            const response = await request(app).get(`/stocks/items/lookup/${barcode}`);
            expect(response.status).toBe(400);
            expect(response.body.code).toBe("VALIDATION_ERROR");
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );

    it("looks up existing items without contacting OFF", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const barcode = "0012345678901";
        const created = await request(app).post("/stocks/items").send({ label: "Riz", defaultUnit: "g", barcode });
        const response = await request(app).get(`/stocks/items/lookup/${barcode}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ barcode, existingItem: created.body, suggestion: null });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(["12345678", "12345678901234"])("accepts barcode length boundaries: %s", async (barcode) => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
            status: 1, product: { product_name: "riz", quantity: "500 g" },
        })));
        const response = await request(app).get(`/stocks/items/lookup/${barcode}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            barcode, existingItem: null,
            suggestion: { label: "Riz", brand: null, imageUrl: null, quantity: 500, unit: "g" },
        });
    });

    it("returns 200 with no suggestion when OFF is unavailable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("OFF unavailable")));
        const response = await request(app).get("/stocks/items/lookup/0012345678901");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ barcode: "0012345678901", existingItem: null, suggestion: null });
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

    it("PATCH /stocks/items/:id met à jour un stock item", async () => {
        const created = await request(app)
            .post("/stocks/items")
            .send({
                label: "Pâtes",
                defaultUnit: "paquet",
                units: [],
            });

        const response = await request(app)
            .patch(`/stocks/items/${created.body.id}`)
            .send({
                label: "Riz",
                defaultUnit: "sachet",
                units: [],
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            id: created.body.id,
            label: "Riz",
            defaultUnit: "sachet",
        });
    });
});
