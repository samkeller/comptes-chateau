import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../../../tests/testApp";
import { testDataSource } from "../../../tests/testDbSetup";
import { StockItem } from "../entities/StockItem";
import { OpenFoodFactsApiCall } from "../entities/OpenFoodFactsApiCall";
import { openFoodFactsThrottle } from "../clients/OpenFoodFactsClient";

describe("StockItemRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: stockRoutes } =
            await import("../routes/StockRoutes");

        app = createTestApp("/stocks", stockRoutes);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        openFoodFactsThrottle.reset();
    });

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

    it("looks up existing items (with lots, any barcode form) without contacting OFF", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const item = await testDataSource.getRepository(StockItem).save({ label: "Riz", defaultUnit: "g", barcode: "012345678905" });

        const response = await request(app).get("/stocks/items/lookup/0012345678905");

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ barcode: "0012345678905", existingItem: { id: item.id, lots: [] }, suggestion: null });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("caches OFF answers: a second lookup does not call the API again", async () => {
        const fetchMock = vi.fn().mockResolvedValue(Response.json({
            status: "success", product: { product_name: "riz", quantity: "500 g" },
        }));
        vi.stubGlobal("fetch", fetchMock);

        for (let attempt = 0; attempt < 2; attempt++) {
            const response = await request(app).get("/stocks/items/lookup/12345678");
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                barcode: "12345678", existingItem: null,
                suggestion: { label: "Riz", brand: null, imageUrl: null, quantity: 500, unit: "g" },
            });
        }
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(await testDataSource.getRepository(OpenFoodFactsApiCall).find()).toEqual([
            expect.objectContaining({ barcode: "12345678", trigger: "lookup", outcome: "found", httpStatus: 200 }),
        ]);
    });

    it("returns 200 with no suggestion when OFF is unavailable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("OFF unavailable")));
        const response = await request(app).get("/stocks/items/lookup/0012345678905");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ barcode: "0012345678905", existingItem: null, suggestion: null });
    });

    it("GET /stocks/items validates its filters", async () => {
        expect((await request(app).get("/stocks/items").query({ expiryState: "rotten" })).status).toBe(400);
        expect((await request(app).get("/stocks/items").query({ includeEmpty: "yes" })).status).toBe(400);
        const response = await request(app).get("/stocks/items").query({ includeEmpty: "false", expiryState: "soon" });
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("GET /stocks/items/:id returns the item with all its lots, or a typed 404", async () => {
        const item = await testDataSource.getRepository(StockItem).save({ label: "Riz", defaultUnit: "g" });
        const ok = await request(app).get(`/stocks/items/${item.id}`);
        expect(ok.status).toBe(200);
        expect(ok.body).toMatchObject({ id: item.id, label: "Riz", lots: [], stockUnitsCount: 0 });

        const missing = await request(app).get("/stocks/items/999");
        expect(missing.status).toBe(404);
        expect(missing.body.code).toBe("STOCK_ITEM_NOT_FOUND");
    });
});
