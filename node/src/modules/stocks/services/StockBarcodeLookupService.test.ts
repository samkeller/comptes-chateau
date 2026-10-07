import type { StockBarcodeLookupResponse, StockItemDto } from "@chocosous/shared";
import { describe, expect, it, vi } from "vitest";
import StockBarcodeLookupService from "./StockBarcodeLookupService";

describe("StockBarcodeLookupService", () => {
    const barcode = "0012345678901";
    const item: StockItemDto = {
        id: 1, label: "Chocolat", barcode, defaultUnit: "g", imageUrl: null,
        stockUnitsCount: 2, nextStockUnitExpiration: "2027-01-01", createdAt: "2026-01-01T00:00:00.000Z",
    };
    const suggestion: StockBarcodeLookupResponse["suggestion"] = {
        label: "Chocolat", brand: "Choco", imageUrl: null, quantity: 100, unit: "g",
    };

    it("returns the existing item without calling OFF", async () => {
        const findByBarcode = vi.fn().mockResolvedValue(item);
        const lookup = vi.fn().mockResolvedValue(suggestion);
        const service = new StockBarcodeLookupService({ findByBarcode }, { lookup });
        expect(await service.lookup(barcode)).toEqual({ barcode, existingItem: item, suggestion: null });
        expect(findByBarcode).toHaveBeenCalledWith(barcode);
        expect(lookup).not.toHaveBeenCalled();
    });

    it("returns an OFF suggestion when no item exists", async () => {
        const lookup = vi.fn().mockResolvedValue(suggestion);
        const service = new StockBarcodeLookupService({ findByBarcode: vi.fn().mockResolvedValue(null) }, { lookup });
        expect(await service.lookup(barcode)).toEqual({ barcode, existingItem: null, suggestion });
        expect(lookup).toHaveBeenCalledWith(barcode);
    });

    it("returns both nulls when OFF fails or does not know the barcode", async () => {
        const service = new StockBarcodeLookupService(
            { findByBarcode: vi.fn().mockResolvedValue(null) },
            { lookup: vi.fn().mockResolvedValue(null) },
        );
        expect(await service.lookup(barcode)).toEqual({ barcode, existingItem: null, suggestion: null });
    });

    it("does not mask database errors as unknown products", async () => {
        const lookup = vi.fn();
        const service = new StockBarcodeLookupService(
            { findByBarcode: vi.fn().mockRejectedValue(new Error("database unavailable")) }, { lookup },
        );
        await expect(service.lookup(barcode)).rejects.toThrow("database unavailable");
        expect(lookup).not.toHaveBeenCalled();
    });
});
