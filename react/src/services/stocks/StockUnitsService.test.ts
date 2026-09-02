import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
import StockUnitsService from "./StockUnitsService";
import { CreateStockUnitDto } from "./dto/CreateStockUnitDto";
import StockUnit from "@/interfaces/stocks/StockUnit";

vi.mock("axios");

describe("StockUnitsService", () => {
    let service: StockUnitsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new StockUnitsService();
    });

    describe("getStockUnitsByItemId", () => {
        it("calls GET /api/stocks/units/ with itemId and returns mapped StockUnit array", async () => {
            const mockData = [
                { id: 1, itemId: 10, quantity: 2, unit: "kg", locationId: 3 },
                { id: 2, itemId: 10, quantity: 5, unit: "g", locationId: 3 },
            ];
            vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

            const result = await service.getStockUnitsByItemId(10);

            expect(axios.get).toHaveBeenCalledWith("/api/stocks/units/", {
                params: { itemId: 10 },
            });
            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(StockUnit);
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(2);
        });
    });

    describe("create", () => {
        it("sends POST request without id/clientId and converts expirationDate", async () => {
            const payload: CreateStockUnitDto = {
                id: 99,
                clientId: "f6bbee1a-3a8b-4c15-a341-866e7fca3e2c",
                locationId: 5,
                quantity: 3,
                unit: "L",
                expirationDate: new Date(2026, 8, 15),
            };

            const mockResponse = {
                id: 42,
                itemId: 10,
                locationId: 5,
                quantity: 3,
                unit: "L",
                expirationDate: "2026-09-15",
            };

            vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

            const result = await service.create(10, payload);

            expect(axios.post).toHaveBeenCalledWith("/api/stocks/units/", {
                itemId: 10,
                locationId: 5,
                quantity: 3,
                unit: "L",
                expirationDate: "2026-09-15",
            });
            expect(result).toBeInstanceOf(StockUnit);
            expect(result.id).toBe(42);
        });
    });

    describe("update", () => {
        it("sends PATCH request without id/clientId", async () => {
            const payload: CreateStockUnitDto = {
                id: 42,
                clientId: `f6bbee1a-3a8b-4c15-a341-866e7fca3e2c`,
                locationId: 5,
                quantity: 4,
                unit: "L",
            };

            const mockResponse = {
                id: 42,
                itemId: 10,
                locationId: 5,
                quantity: 4,
                unit: "L",
                expirationDate: null,
            };

            vi.mocked(axios.patch).mockResolvedValueOnce({ data: mockResponse });

            const result = await service.update(42, 10, payload);

            expect(axios.patch).toHaveBeenCalledWith("/api/stocks/units/42", {
                itemId: 10,
                locationId: 5,
                quantity: 4,
                unit: "L",
            });
            expect(result).toBeInstanceOf(StockUnit);
            expect(result.quantity).toBe(4);
        });
    });

    describe("delete", () => {
        it("sends DELETE request to /api/stocks/units/:id", async () => {
            vi.mocked(axios.delete).mockResolvedValueOnce({ data: null });

            await service.delete(42);

            expect(axios.delete).toHaveBeenCalledWith("/api/stocks/units/42");
        });
    });

    describe("takeUnit", () => {
        it("sends POST request to /api/stocks/units/:id/take and returns StockUnit", async () => {
            const mockResponse = {
                id: 42,
                itemId: 10,
                quantity: 1,
                unit: "pack",
            };
            vi.mocked(axios.post).mockResolvedValueOnce({ data: mockResponse });

            const result = await service.takeUnit(42);

            expect(axios.post).toHaveBeenCalledWith("/api/stocks/units/42/take");
            expect(result).toBeInstanceOf(StockUnit);
            expect(result.id).toBe(42);
        });
    });
});
