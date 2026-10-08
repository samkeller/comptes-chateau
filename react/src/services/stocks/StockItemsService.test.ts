import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { FilterMatchMode } from "primereact/api";
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

    it("serializes DataTable filters and sort without pagination when searching items", async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: [item] });
        const state = {
            first: 0, rows: 50, page: 1, sortField: "label", sortOrder: 1 as const,
            filters: {
                global: { value: "riz", matchMode: FilterMatchMode.CONTAINS },
                locationId: { value: 2, matchMode: FilterMatchMode.EQUALS },
                expiryState: { value: "soon", matchMode: FilterMatchMode.EQUALS },
            },
        };
        expect(await new StockItemsService().search(state, true))
            .toEqual([item]);
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/items", {
            params: new URLSearchParams({
                sortField: "label",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    { type: "simple", field: "global", matchMode: "contains", value: "riz" },
                    { type: "simple", field: "locationId", matchMode: "equals", value: 2 },
                    { type: "simple", field: "expiryState", matchMode: "equals", value: "soon" },
                ]),
                includeEmpty: "true",
            }),
        });

        vi.mocked(axios.get).mockResolvedValueOnce({ data: [] });
        await new StockItemsService().searchByText(" ", true);
        expect(axios.get).toHaveBeenLastCalledWith("/api/stocks/items", {
            params: new URLSearchParams({ includeEmpty: "true" }),
        });
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
