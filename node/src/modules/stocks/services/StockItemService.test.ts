import { beforeEach, describe, expect, it } from "vitest";
import { testDataSource } from "../../../tests/testDbSetup";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockUnit } from "../entities/StockUnit";
import type { ParsedQs } from "qs";
import StockItemService from "./StockItemService";

describe("StockItemService", () => {
    const now = new Date(2026, 9, 6, 12);
    let service: StockItemService;
    let kitchen: StockLocation;
    let cellar: StockLocation;

    function tableQuery(filters: { field: string; matchMode: string; value: unknown }[]): ParsedQs {
        return {
            filters: JSON.stringify(filters.map((filter) => ({ type: "simple", ...filter }))),
        };
    }

    beforeEach(async () => {
        service = new StockItemService(testDataSource.manager);
        [kitchen, cellar] = await testDataSource.getRepository(StockLocation).save([{ label: "Cuisine" }, { label: "Cave" }]);
    });

    async function seed() {
        const [rice, milk, empty] = await testDataSource.getRepository(StockItem).save([
            { label: "Riz", defaultUnit: "kg", barcode: "0012345678905", brand: "Taureau" },
            { label: "Lait", defaultUnit: "L" },
            { label: "Farine épuisée", defaultUnit: "kg" },
        ]);
        await testDataSource.getRepository(StockUnit).save([
            { itemId: rice.id, locationId: kitchen.id, quantity: 1, unit: "kg", expirationDate: "2026-12-01" },
            { itemId: rice.id, locationId: kitchen.id, quantity: 1, unit: "kg", expirationDate: "2026-12-01" },
            { itemId: rice.id, locationId: cellar.id, quantity: 1, unit: "kg", expirationDate: null },
            { itemId: milk.id, locationId: kitchen.id, quantity: 1, unit: "l", expirationDate: "2026-10-05" },
            { itemId: milk.id, locationId: kitchen.id, quantity: 1, unit: "L", expirationDate: "2026-10-05" },
        ]);
        return { rice, milk, empty };
    }

    describe("search", () => {
        it("returns in-stock items with server-side lots, nearest expiration first", async () => {
            const { rice, milk } = await seed();
            const result = await service.search({}, false, now);

            expect(result.map((item) => item.id)).toEqual([milk.id, rice.id]);
            // Les unités historiques « l » et « L » forment un seul lot.
            expect(result[0].lots).toEqual([{
                locationId: kitchen.id, locationLabel: "Cuisine", quantity: 1, unit: "L",
                expirationDate: "2026-10-05", expiryState: "expired", unitIds: expect.any(Array),
            }]);
            expect(result[0].lots[0].unitIds).toHaveLength(2);
            expect(result[1]).toMatchObject({ stockUnitsCount: 3, nextStockUnitExpiration: "2026-12-01", brand: "Taureau" });
            expect(result[1].lots.map((lot) => [lot.locationLabel, lot.expirationDate, lot.unitIds.length, lot.expiryState]))
                .toEqual([["Cuisine", "2026-12-01", 2, "ok"], ["Cave", null, 1, "none"]]);
        });

        it("keeps empty items findable on demand", async () => {
            const { empty } = await seed();
            expect((await service.search({}, false, now)).some((item) => item.id === empty.id)).toBe(false);
            const all = await service.search({}, true, now);
            expect(all.find((item) => item.id === empty.id)).toMatchObject({ stockUnitsCount: 0, lots: [] });
        });

        it("filters by location, keeping only the lots of that location", async () => {
            const { rice } = await seed();
            const result = await service.search(tableQuery([
                { field: "locationId", matchMode: "equals", value: cellar.id },
            ]), false, now);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ id: rice.id, stockUnitsCount: 1, nextStockUnitExpiration: null });
        });

        it("filters by expiry state", async () => {
            const { milk, rice } = await seed();
            expect((await service.search(tableQuery([
                { field: "expiryState", matchMode: "equals", value: "expired" },
            ]), false, now)).map((item) => item.id)).toEqual([milk.id]);
            expect((await service.search(tableQuery([
                { field: "expiryState", matchMode: "equals", value: "none" },
            ]), false, now)).map((item) => item.id)).toEqual([rice.id]);
            expect(await service.search(tableQuery([
                { field: "expiryState", matchMode: "equals", value: "soon" },
            ]), false, now)).toEqual([]);
        });

        it("searches by name, brand or barcode (any historical form) and escapes SQL wildcards", async () => {
            const { rice } = await seed();
            const globalFilter = (value: string) => tableQuery([
                { field: "global", matchMode: "contains", value },
            ]);
            expect((await service.search(globalFilter("riz"), false, now)).map((item) => item.id)).toEqual([rice.id]);
            expect((await service.search(globalFilter("taur"), false, now)).map((item) => item.id)).toEqual([rice.id]);
            expect((await service.search(globalFilter("012345678905"), false, now)).map((item) => item.id)).toEqual([rice.id]);
            expect(await service.search(globalFilter("%"), false, now)).toEqual([]);
        });

        it("sorts products through the generic table-query contract without pagination", async () => {
            await seed();
            const result = await service.search({ sortField: "label", sortOrder: "DESC" }, false, now);

            expect(result.map((item) => item.label)).toEqual(["Riz", "Lait"]);
        });
    });

    describe("findByBarcode", () => {
        it("returns null when no item matches the barcode", async () => {
            expect(await service.findByBarcode("12345678")).toBeNull();
        });

        it("matches legacy non-normalized barcodes", async () => {
            const legacy = await testDataSource.getRepository(StockItem).save({ label: "UPC", defaultUnit: "g", barcode: "012345678905" });
            expect((await service.findByBarcode("0012345678905"))?.id).toBe(legacy.id);
        });

        it("selects the latest createdAt then the highest id for duplicate barcodes", async () => {
            const repo = testDataSource.getRepository(StockItem);
            await repo.save({ label: "Old", defaultUnit: "g", barcode: "12345678", createdAt: new Date("2026-01-01") });
            const sameDateLow = await repo.save({ label: "Low", defaultUnit: "g", barcode: "12345678", createdAt: new Date("2026-02-01") });
            const sameDateHigh = await repo.save({ label: "High", defaultUnit: "g", barcode: "12345678", createdAt: new Date("2026-02-01") });
            expect(sameDateHigh.id).toBeGreaterThan(sameDateLow.id);
            expect((await service.findByBarcode("12345678"))?.label).toBe("High");
        });
    });

    describe("save", () => {
        it("creates then updates an item, keeping omitted optional fields", async () => {
            const { item, created } = await service.save({ label: "Pâtes", defaultUnit: "g", barcode: "12345678", brand: "Panz", imageUrl: null });
            expect(created).toBe(true);
            const updated = await service.save({ id: item.id, label: "Pâtes complètes", defaultUnit: "kg" });
            expect(updated.created).toBe(false);
            expect(await testDataSource.getRepository(StockItem).findOneByOrFail({ id: item.id }))
                .toMatchObject({ label: "Pâtes complètes", defaultUnit: "kg", barcode: "12345678", brand: "Panz" });
        });

        it("throws a typed 404 for an unknown item", async () => {
            await expect(service.save({ id: 999, label: "X", defaultUnit: "g" }))
                .rejects.toMatchObject({ statusCode: 404, code: "STOCK_ITEM_NOT_FOUND" });
        });
    });

    describe("OpenFoodFacts backfill helpers", () => {
        it("normalizes legacy barcodes idempotently", async () => {
            const item = await testDataSource.getRepository(StockItem).save({ label: "UPC", defaultUnit: "g", barcode: "012345678905" });
            expect(await service.normalizeBarcode(item)).toBe(true);
            expect(await service.normalizeBarcode(item)).toBe(false);
            expect((await testDataSource.getRepository(StockItem).findOneByOrFail({ id: item.id })).barcode).toBe("0012345678905");
        });

        it("fills missing brand and image without overwriting user values", async () => {
            const repo = testDataSource.getRepository(StockItem);
            const blank = await repo.save({ label: "A", defaultUnit: "g" });
            const typed = await repo.save({ label: "B", defaultUnit: "g", brand: "Mine", imageUrl: "https://mine/img.jpg" });
            const suggestion = { label: "OFF", brand: "OffBrand", imageUrl: "https://off/img.jpg", quantity: null, unit: null };

            expect(await service.enrichFromSuggestion(blank, suggestion)).toBe(true);
            expect(await service.enrichFromSuggestion(typed, suggestion)).toBe(false);
            expect(await repo.findOneByOrFail({ id: blank.id })).toMatchObject({ label: "A", brand: "OffBrand", imageUrl: "https://off/img.jpg" });
            expect(await repo.findOneByOrFail({ id: typed.id })).toMatchObject({ brand: "Mine", imageUrl: "https://mine/img.jpg" });
        });
    });
});
