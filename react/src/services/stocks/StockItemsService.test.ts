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

    it("duplicates a lot using one new copy and preserves optional product fields", async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({ data: item });
        await new StockEntryService().duplicateLot(item, { ...item.lots[0], unit: "l" });

        expect(axios.post).toHaveBeenCalledWith("/api/stocks/entries", {
            item: { id: 1, label: "Riz", defaultUnit: "g" },
            lots: [{ unitIds: [], copies: 1, locationId: 2, quantity: 500, unit: "L", expirationDate: null }],
        });
    });

    it("edits only the selected lot, preserving untouched fields and converting dates", async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: item });
        const service = new StockEntryService();
        const lot = { ...item.lots[0], unitIds: [9, 10], expirationDate: "2026-12-01" };
        await service.editLot(item, lot, { quantity: 2 });
        expect(axios.post).toHaveBeenLastCalledWith("/api/stocks/entries", {
            item: { id: 1, label: "Riz", defaultUnit: "g" },
            lots: [{ unitIds: [9, 10], copies: 2, locationId: 2, quantity: 2, unit: "g", expirationDate: "2026-12-01" }],
        });
        await service.editLot(item, lot, { expirationDate: null, copies: 1 });
        expect(vi.mocked(axios.post).mock.lastCall?.[1].lots[0]).toMatchObject({ unitIds: [9, 10], copies: 1, expirationDate: null });
        await service.editLot(item, lot, { expirationDate: new Date(2027, 1, 3), locationId: 1 });
        expect(vi.mocked(axios.post).mock.lastCall?.[1].lots[0]).toMatchObject({ locationId: 1, expirationDate: "2027-02-03" });
        expect(lot).toMatchObject({ locationId: 2, quantity: 500, unitIds: [9, 10], expirationDate: "2026-12-01" });
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
