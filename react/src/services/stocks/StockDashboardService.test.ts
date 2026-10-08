import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import type { StockDashboardOverviewDto, StockMovementDto } from "@chocosous/shared";
import StockDashboardService from "./StockDashboardService";

vi.mock("axios");

describe("StockDashboardService", () => {
    const service = new StockDashboardService();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads typed stock metrics from the overview endpoint", async () => {
        const overview: StockDashboardOverviewDto = {
            inStockItemCount: 2,
            stockUnitCount: 5,
            datedUnitCount: 4,
            expiredUnitCount: 1,
            expiringSoonUnitCount: 2,
        };
        vi.mocked(axios.get).mockResolvedValueOnce({ data: overview });

        expect(await service.getOverview()).toEqual(overview);
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/dashboard/overview");
    });

    it("preserves historical movement details and timestamps", async () => {
        const movement: StockMovementDto = {
            id: 1,
            itemId: 10,
            itemLabel: "Riz",
            unitId: 2,
            quantity: 1.5,
            unit: "kg",
            locationId: 3,
            locationLabel: "Cuisine",
            type: "OUT",
            createdAt: "2026-10-06T08:00:00.000Z",
        };
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [movement] });

        expect(await service.getLastMovements(50)).toEqual([movement]);
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/dashboard/last-movements", { params: { limit: 50 } });
    });

    it("preserves an empty movement list", async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });
        expect(await service.getLastMovements()).toEqual([]);
    });

    it.each(["getOverview", "getLastMovements"] as const)("propagates %s failures to the UI", async (method) => {
        const failure = new Error("Network unavailable");
        vi.mocked(axios.get).mockRejectedValueOnce(failure);

        await expect(service[method]()).rejects.toThrow(failure);
    });
});
