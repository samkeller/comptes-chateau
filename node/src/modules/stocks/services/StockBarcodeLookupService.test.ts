import { describe, expect, it, vi } from "vitest";
import type { StockItemWithLotsDto } from "@chocosous/shared";
import StockBarcodeLookupService from "./StockBarcodeLookupService";
import type { StockItem } from "../entities/StockItem";

describe("StockBarcodeLookupService", () => {
    const existing = { id: 7, label: "Riz", lots: [] } as unknown as StockItemWithLotsDto;
    const suggestion = { label: "Riz", brand: null, imageUrl: null, quantity: 1, unit: "kg" as const };

    function build(found: boolean) {
        const itemService = {
            findByBarcode: vi.fn().mockResolvedValue(found ? ({ id: 7 } as StockItem) : null),
            getWithLots: vi.fn().mockResolvedValue(existing),
        };
        const offService = { getSuggestion: vi.fn().mockResolvedValue(suggestion) };
        return { itemService, offService, service: new StockBarcodeLookupService(itemService, offService) };
    }

    it("returns the existing item with its lots without calling OFF", async () => {
        const { service, offService } = build(true);
        expect(await service.lookup("12345678")).toEqual({ barcode: "12345678", existingItem: existing, suggestion: null });
        expect(offService.getSuggestion).not.toHaveBeenCalled();
    });

    it("normalizes UPC-A codes before searching and asking OFF", async () => {
        const { service, itemService, offService } = build(false);
        expect(await service.lookup("012345678905")).toEqual({ barcode: "0012345678905", existingItem: null, suggestion });
        expect(itemService.findByBarcode).toHaveBeenCalledWith("0012345678905");
        expect(offService.getSuggestion).toHaveBeenCalledWith("0012345678905", "lookup");
    });

    it("does not mask database errors as unknown products", async () => {
        const { service, itemService } = build(false);
        itemService.findByBarcode.mockRejectedValue(new Error("db down"));
        await expect(service.lookup("12345678")).rejects.toThrow("db down");
    });
});
