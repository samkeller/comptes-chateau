import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { testDataSource } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";
import StockMovementService from "../services/StockMovementService";
import StockUnitService from "../services/StockUnitService";

describe("StockDashboardRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: routes } = await import("./StockDashboardRoutes");
        app = createTestApp("/stocks/dashboard", routes);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("returns zero metrics for an empty stock, even with catalog products", async () => {
        await testDataSource.getRepository(StockItem).save({ label: "Catalog only", defaultUnit: "kg" });

        const response = await request(app).get("/stocks/dashboard/overview");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            inStockItemCount: 0,
            stockUnitCount: 0,
            datedUnitCount: 0,
            expiredUnitCount: 0,
            expiringSoonUnitCount: 0,
        });
    });

    it("counts current lots and distinct products with inclusive calendar-day boundaries", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 6, 12));
        const location = await testDataSource.getRepository(StockLocation).save({ label: "Kitchen" });
        const items = await testDataSource.getRepository(StockItem).save([
            { label: "Rice", defaultUnit: "kg" },
            { label: "Milk", defaultUnit: "L" },
            { label: "Removed", defaultUnit: "pack" },
        ]);
        const repo = testDataSource.getRepository(StockUnit);
        await repo.save([
            { itemId: items[0].id, locationId: location.id, quantity: 1, unit: "kg", expirationDate: "2026-10-05" },
            { itemId: items[0].id, locationId: location.id, quantity: 2, unit: "kg", expirationDate: "2026-10-06" },
            { itemId: items[0].id, locationId: location.id, quantity: 3, unit: "kg", expirationDate: "2026-11-05" },
            { itemId: items[1].id, locationId: location.id, quantity: 4, unit: "L", expirationDate: "2026-11-06" },
            { itemId: items[1].id, locationId: location.id, quantity: 5, unit: "L", expirationDate: null },
        ]);
        const removed = await repo.save({
            itemId: items[2].id, locationId: location.id, quantity: 1, unit: "pack", expirationDate: "2026-10-05",
        });
        await repo.remove(removed);

        const response = await request(app).get("/stocks/dashboard/overview");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            inStockItemCount: 2,
            stockUnitCount: 5,
            datedUnitCount: 4,
            expiredUnitCount: 1,
            expiringSoonUnitCount: 2,
        });
    });

    it("returns an empty movement list without history", async () => {
        const response = await request(app).get("/stocks/dashboard/last-movements");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("returns only the newest movements (limit) with deterministic ties and historical labels", async () => {
        const repo = testDataSource.getRepository(StockMovement);
        const movements = [];
        for (let index = 0; index < 12; index++) {
            movements.push(await repo.save({
                itemId: 42,
                itemLabel: "Historical product",
                unitId: index + 1,
                quantity: index + 0.5,
                unit: "kg",
                locationId: 99,
                locationLabel: "Historical location",
                type: index % 3 === 0 ? "IN" : index % 3 === 1 ? "OUT" : "DELETE",
                createdAt: new Date(index < 6 ? "2026-10-05T10:00:00Z" : "2026-10-06T10:00:00Z"),
            }));
        }

        const response = await request(app).get("/stocks/dashboard/last-movements").query({ limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(10);
        expect(response.body.map((movement: { id: number }) => movement.id))
            .toEqual(movements.slice(2).reverse().map((movement) => movement.id));
        expect(response.body[0]).toEqual({
            id: movements[11].id,
            itemId: 42,
            itemLabel: "Historical product",
            unitId: 12,
            quantity: 11.5,
            unit: "kg",
            locationId: 99,
            locationLabel: "Historical location",
            type: "DELETE",
            createdAt: "2026-10-06T10:00:00.000Z",
        });
    });

    it("returns 20 movements by default and rejects an out-of-range limit", async () => {
        const repo = testDataSource.getRepository(StockMovement);
        for (let index = 0; index < 25; index++) {
            await repo.save({
                itemId: 1, itemLabel: "P", unitId: index + 1, quantity: 1, unit: "g",
                locationId: 1, locationLabel: "L", type: "ADJUST",
            });
        }
        expect((await request(app).get("/stocks/dashboard/last-movements")).body).toHaveLength(20);
        expect((await request(app).get("/stocks/dashboard/last-movements").query({ limit: 101 })).status).toBe(400);
    });

    it.each(["overview", "last-movements"])("propagates %s failures through the error middleware", async (endpoint) => {
        const failure = new Error("Database unavailable");
        if (endpoint === "overview") {
            vi.spyOn(StockUnitService.prototype, "getOverview").mockRejectedValueOnce(failure);
        } else {
            vi.spyOn(StockMovementService.prototype, "getLastMovements").mockRejectedValueOnce(failure);
        }
        const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const response = await request(app).get(`/stocks/dashboard/${endpoint}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ code: "INTERNAL_ERROR", message: "Internal server error" });
        expect(log).toHaveBeenCalledWith("[Unhandled Error]", failure);
    });
});
