import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { testDataSource } from "../../../tests/testDbSetup";
import type { OpenFoodFactsFetchResult } from "../clients/OpenFoodFactsClient";
import { OpenFoodFactsApiCall } from "../entities/OpenFoodFactsApiCall";
import { OpenFoodFactsProduct } from "../entities/OpenFoodFactsProduct";
import OpenFoodFactsProductService, { OFF_FOUND_REFRESH_DAYS, OFF_NOT_FOUND_REFRESH_DAYS } from "./OpenFoodFactsProductService";

describe("OpenFoodFactsProductService", () => {
    const now = new Date("2026-10-08T10:00:00Z");
    const found: OpenFoodFactsFetchResult = { outcome: "found", httpStatus: 200, durationMs: 12, product: { product_name: "riz", brands: "Taureau" } };
    const fetchProduct = vi.fn<(barcode: string) => Promise<OpenFoodFactsFetchResult | null>>();
    let service: OpenFoodFactsProductService;

    beforeEach(() => {
        fetchProduct.mockReset();
        service = new OpenFoodFactsProductService(testDataSource.manager, { fetchProduct });
    });

    it("fetches once, stores the raw product and logs the call", async () => {
        fetchProduct.mockResolvedValue(found);

        expect(await service.getSuggestion("12345678", "lookup", now)).toMatchObject({ label: "Riz", brand: "Taureau" });
        expect(await service.getSuggestion("12345678", "lookup", now)).toMatchObject({ label: "Riz" });

        expect(fetchProduct).toHaveBeenCalledTimes(1);
        expect(await testDataSource.getRepository(OpenFoodFactsProduct).findOneByOrFail({ barcode: "12345678" }))
            .toMatchObject({ status: "found", product: found.product });
        expect(await testDataSource.getRepository(OpenFoodFactsApiCall).count()).toBe(1);
    });

    it("remembers unknown products and retries them after the not-found refresh delay", async () => {
        fetchProduct.mockResolvedValue({ outcome: "not_found", httpStatus: 404, durationMs: 5, product: null });
        expect(await service.getSuggestion("12345678", "lookup", now)).toBeNull();
        expect(await service.getSuggestion("12345678", "lookup", addDays(now, OFF_NOT_FOUND_REFRESH_DAYS - 1))).toBeNull();
        expect(fetchProduct).toHaveBeenCalledTimes(1);

        fetchProduct.mockResolvedValue(found);
        expect(await service.getSuggestion("12345678", "lookup", addDays(now, OFF_NOT_FOUND_REFRESH_DAYS))).toMatchObject({ label: "Riz" });
        expect(fetchProduct).toHaveBeenCalledTimes(2);
    });

    it("keeps using the stored product when OFF fails, and logs the failed call", async () => {
        fetchProduct.mockResolvedValueOnce(found);
        await service.getSuggestion("12345678", "lookup", now);

        fetchProduct.mockResolvedValueOnce({ outcome: "http_error", httpStatus: 500, durationMs: 5, product: null });
        const later = addDays(now, OFF_FOUND_REFRESH_DAYS + 1);
        expect(await service.needsRefresh("12345678", later)).toBe(true);
        expect(await service.getSuggestion("12345678", "lookup", later)).toMatchObject({ label: "Riz" });
        expect((await testDataSource.getRepository(OpenFoodFactsApiCall).find({ order: { id: "ASC" } })).map((call) => call.outcome))
            .toEqual(["found", "http_error"]);
    });

    it("does not log anything when the client skipped the call (local quota, open circuit)", async () => {
        fetchProduct.mockResolvedValue(null);
        expect(await service.getSuggestion("12345678", "lookup", now)).toBeNull();
        expect(await testDataSource.getRepository(OpenFoodFactsApiCall).count()).toBe(0);
        expect(await service.getStoredSuggestion("12345678")).toBeNull();
    });
});
