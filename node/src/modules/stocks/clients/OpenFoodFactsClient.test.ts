import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OpenFoodFactsClient from "./OpenFoodFactsClient";

describe("OpenFoodFactsClient", () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = new OpenFoodFactsClient();
    const barcode = "0012345678901";

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    function productResponse(product: Record<string, unknown>): void {
        fetchMock.mockResolvedValue(Response.json({ status: 1, product }));
    }

    it("requests only the fixed OFF fields with an identifying User-Agent", async () => {
        productResponse({
            product_name: "  chocolat Noir  ",
            brands: "  Choco  ",
            image_front_small_url: " https://images.openfoodfacts.org/choco.jpg ",
            product_quantity: 100,
            product_quantity_unit: "g",
        });
        expect(await client.lookup(barcode)).toEqual({
            label: "Chocolat Noir",
            brand: "Choco",
            imageUrl: "https://images.openfoodfacts.org/choco.jpg",
            quantity: 100,
            unit: "g",
        });
        expect(fetchMock).toHaveBeenCalledWith(
            `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,image_front_small_url,product_quantity,product_quantity_unit,quantity`,
            {
                headers: { "User-Agent": "Chocosous/1.0 (https://github.com/samkeller/comptes-chateau)" },
                signal: expect.any(AbortSignal),
            },
        );
    });

    it.each([
        ["g", "g"], ["kg", "kg"], ["ml", "ml"], ["cl", "cl"], ["l", "L"], ["L", "L"],
    ])("maps the unit %s to %s", async (input, expected) => {
        productResponse({ product_name: "lait", product_quantity: "1.5", product_quantity_unit: input });
        expect(await client.lookup(barcode)).toMatchObject({ quantity: 1.5, unit: expected });
    });

    it.each([" 1,5 L ", "1.5 l"])("uses a simple textual quantity fallback: %s", async (quantity) => {
        productResponse({ product_name: "lait", quantity });
        expect(await client.lookup(barcode)).toMatchObject({ quantity: 1.5, unit: "L" });
    });

    it("prefers structured quantity and falls back when it is invalid", async () => {
        productResponse({ product_name: "riz", product_quantity: -1, product_quantity_unit: "g", quantity: "500 g" });
        expect(await client.lookup(barcode)).toMatchObject({ quantity: 500, unit: "g" });
        productResponse({ product_name: "riz", product_quantity: 250, product_quantity_unit: "g", quantity: "500 g" });
        expect(await client.lookup(barcode)).toMatchObject({ quantity: 250, unit: "g" });
    });

    it.each(["6 x 100 g", "500 oz", "0 g", "Infinity kg", "250 g environ", "1e3 g"])(
        "does not guess ambiguous or invalid quantities: %s",
        async (quantity) => {
            productResponse({ product_name: "riz", quantity });
            expect(await client.lookup(barcode)).toEqual({
                label: "Riz", brand: null, imageUrl: null, quantity: null, unit: null,
            });
        },
    );

    it.each([0, -1, Number.POSITIVE_INFINITY, "NaN", {}, true])("rejects invalid structured quantities: %s", async (quantity) => {
        productResponse({ product_name: "riz", product_quantity: quantity, product_quantity_unit: "g" });
        expect(await client.lookup(barcode)).toMatchObject({ quantity: null, unit: null });
    });

    it("normalizes absent or malformed optional fields without losing the product", async () => {
        productResponse({ product_name: "  é".repeat(200), brands: 123, image_front_small_url: "javascript:alert(1)" });
        const result = await client.lookup(barcode);
        expect(result?.label).toHaveLength(255);
        expect(result?.label?.startsWith("É")).toBe(true);
        expect(result).toMatchObject({ brand: null, imageUrl: null, quantity: null, unit: null });
    });

    it.each([
        { status: 0 },
        { status: 1 },
        { status: 1, product: null },
        null,
    ])("returns null for unknown or malformed products: %s", async (payload) => {
        fetchMock.mockResolvedValue(Response.json(payload));
        expect(await client.lookup(barcode)).toBeNull();
    });

    it.each([undefined, "", "  ", null, 10])(
        "preserves suggestions with a null label for absent or invalid product names: %s",
        async (productName) => {
            productResponse({
                product_name: productName,
                brands: " Choco ",
                image_front_small_url: "https://images.openfoodfacts.org/choco.jpg",
                quantity: "100 g",
            });
            expect(await client.lookup(barcode)).toEqual({
                label: null,
                brand: "Choco",
                imageUrl: "https://images.openfoodfacts.org/choco.jpg",
                quantity: 100,
                unit: "g",
            });
        },
    );

    it("preserves a known product even when all suggestion fields are missing", async () => {
        productResponse({});
        expect(await client.lookup(barcode)).toEqual({
            label: null, brand: null, imageUrl: null, quantity: null, unit: null,
        });
    });

    it("returns null for non-OK HTTP responses", async () => {
        fetchMock.mockResolvedValue(new Response("unavailable", { status: 503 }));
        expect(await client.lookup(barcode)).toBeNull();
    });

    it("returns null for invalid JSON and network errors", async () => {
        fetchMock.mockResolvedValue(new Response("not json"));
        expect(await client.lookup(barcode)).toBeNull();
        fetchMock.mockRejectedValue(new Error("network unavailable"));
        expect(await client.lookup(barcode)).toBeNull();
    });

    it("aborts a slow fetch after exactly three seconds and clears its timer", async () => {
        vi.useFakeTimers();
        let signal: AbortSignal | null = null;
        fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
            signal = options?.signal ?? null;
            signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        }));
        const pending = client.lookup(barcode);
        await vi.advanceTimersByTimeAsync(2999);
        expect(signal?.aborted).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(await pending).toBeNull();
        expect(signal?.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("clears the timeout on success", async () => {
        vi.useFakeTimers();
        productResponse({ product_name: "riz" });
        expect(await client.lookup(barcode)).not.toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(["1234567", "123456789012345", "1234abcd", "../12345678", " 12345678"])(
        "never sends invalid barcodes to OFF: %s",
        async (invalid) => {
            expect(await client.lookup(invalid)).toBeNull();
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );
});
