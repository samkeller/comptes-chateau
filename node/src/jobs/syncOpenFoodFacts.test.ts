import { beforeEach, describe, expect, it, vi } from "vitest";
import { testDataSource } from "../tests/testDbSetup";
import type { OpenFoodFactsFetchResult } from "../modules/stocks/clients/OpenFoodFactsClient";
import { StockItem } from "../modules/stocks/entities/StockItem";
import { OpenFoodFactsApiCall } from "../modules/stocks/entities/OpenFoodFactsApiCall";
import OpenFoodFactsProductService from "../modules/stocks/services/OpenFoodFactsProductService";
import { syncOpenFoodFacts } from "./syncOpenFoodFacts";

describe("syncOpenFoodFacts", () => {
    const now = new Date("2026-10-08T03:30:00Z");
    const fetchProduct = vi.fn<(barcode: string) => Promise<OpenFoodFactsFetchResult | null>>();
    const sleep = vi.fn(async () => undefined);
    let productService: OpenFoodFactsProductService;

    beforeEach(() => {
        fetchProduct.mockReset();
        sleep.mockClear();
        fetchProduct.mockImplementation(async (barcode) => ({
            outcome: "found", httpStatus: 200, durationMs: 1,
            product: { product_name: `OFF ${barcode}`, brands: "OffBrand", image_front_small_url: `https://img/${barcode}.jpg` },
        }));
        productService = new OpenFoodFactsProductService(testDataSource.manager, { fetchProduct });
    });

    it("normalizes barcodes, stores OFF products and enriches existing items without overwriting user data", async () => {
        const repo = testDataSource.getRepository(StockItem);
        const legacy = await repo.save({ label: "Mon riz", defaultUnit: "g", barcode: "012345678905" });
        const typed = await repo.save({ label: "Mes pâtes", defaultUnit: "g", barcode: "12345678", brand: "Maison" });
        const duplicate = await repo.save({ label: "Mes pâtes bis", defaultUnit: "g", barcode: "12345678" });
        await repo.save({ label: "Sans code", defaultUnit: "g" });

        const result = await syncOpenFoodFacts(testDataSource.manager, { now, sleep, productService });

        expect(result).toEqual({ normalizedBarcodes: 1, fetchedBarcodes: 2, enrichedItems: 3 });
        expect(fetchProduct.mock.calls.map(([barcode]) => barcode)).toEqual(["0012345678905", "12345678"]);
        expect(sleep).toHaveBeenCalledTimes(1);
        expect(await repo.findOneByOrFail({ id: legacy.id })).toMatchObject({
            label: "Mon riz", barcode: "0012345678905", brand: "OffBrand", imageUrl: "https://img/0012345678905.jpg",
        });
        expect(await repo.findOneByOrFail({ id: typed.id })).toMatchObject({ label: "Mes pâtes", brand: "Maison", imageUrl: "https://img/12345678.jpg" });
        expect(await repo.findOneByOrFail({ id: duplicate.id })).toMatchObject({ brand: "OffBrand" });
        expect(await testDataSource.getRepository(OpenFoodFactsApiCall).findBy({ trigger: "backfill" })).toHaveLength(2);
    });

    it("is idempotent and respects the per-run call budget", async () => {
        const repo = testDataSource.getRepository(StockItem);
        await repo.save([
            { label: "A", defaultUnit: "g", barcode: "11111111" },
            { label: "B", defaultUnit: "g", barcode: "22222222" },
            { label: "C", defaultUnit: "g", barcode: "33333333" },
        ]);

        expect(await syncOpenFoodFacts(testDataSource.manager, { now, sleep, productService, maxCalls: 2 }))
            .toMatchObject({ fetchedBarcodes: 2, enrichedItems: 2 });
        expect(await syncOpenFoodFacts(testDataSource.manager, { now, sleep, productService, maxCalls: 2 }))
            .toMatchObject({ fetchedBarcodes: 1, enrichedItems: 1 });
        expect(await syncOpenFoodFacts(testDataSource.manager, { now, sleep, productService, maxCalls: 2 }))
            .toEqual({ normalizedBarcodes: 0, fetchedBarcodes: 0, enrichedItems: 0 });
        expect(fetchProduct).toHaveBeenCalledTimes(3);
    });
});
