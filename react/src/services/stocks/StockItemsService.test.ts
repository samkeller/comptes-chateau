import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import type { SaveStockEntryDto, StockItemWithLotsDto } from "@chocosous/shared";
import StockItemsService from "./StockItemsService";
import StockEntryService from "./StockEntryService";
import StockUnitsService from "./StockUnitsService";

vi.mock("axios");

const item: StockItemWithLotsDto = {
    id: 1, label: "Riz", barcode: null, brand: null, defaultUnit: "g", imageUrl: null,
    stockUnitsCount: 1, nextStockUnitExpiration: null, createdAt: "2026-10-01T00:00:00.000Z",
    lots: [{ locationId: 2, locationLabel: "Cellier", quantity: 500, unit: "g", expirationDate: null, expiryState: "none", unitIds: [9] }],
};

describe("stock services", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("sends only the active filters when searching items", async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [item] });
        expect(await new StockItemsService().search({ search: "  riz ", locationId: 2, expiryState: "soon", includeEmpty: true }))
            .toEqual([item]);
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/items", {
            params: { search: "riz", locationId: 2, expiryState: "soon", includeEmpty: "true" },
        });

        vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });
        await new StockItemsService().search({ search: " ", locationId: null, expiryState: null, includeEmpty: false });
        expect(axios.get).toHaveBeenLastCalledWith("/api/stocks/items", { params: {} });
    });

    it("loads one item with its lots", async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: item });
        expect(await new StockItemsService().getOne(1)).toEqual(item);
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/items/1");
    });

    it("posts an atomic entry and returns the saved item", async () => {
        const entry: SaveStockEntryDto = {
            item: { label: "Riz", defaultUnit: "g" },
            lots: [{ unitIds: [], copies: 2, locationId: 2, quantity: 500, unit: "g", expirationDate: "2026-12-01" }],
        };
        vi.mocked(axios.post).mockResolvedValueOnce({ data: item });
        expect(await new StockEntryService().save(entry)).toEqual(item);
        expect(axios.post).toHaveBeenCalledWith("/api/stocks/entries", entry);
    });

    it("takes and deletes one unit", async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({ status: 204, data: "" });
        vi.mocked(axios.delete).mockResolvedValueOnce({ status: 204, data: "" });
        await expect(new StockUnitsService().take(9)).resolves.toBeUndefined();
        await expect(new StockUnitsService().delete(9)).resolves.toBeUndefined();
        expect(axios.post).toHaveBeenCalledWith("/api/stocks/units/9/take");
        expect(axios.delete).toHaveBeenCalledWith("/api/stocks/units/9");
    });

    it("propagates API failures (toasts are handled by the interceptor)", async () => {
        const failure = new Error("boom");
        vi.mocked(axios.post).mockRejectedValueOnce(failure);
        await expect(new StockUnitsService().take(9)).rejects.toThrow(failure);
    });
});
