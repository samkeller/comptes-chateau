import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OpenFoodFactsClient, { OPEN_FOOD_FACTS_FIELDS, OPEN_FOOD_FACTS_MAX_CALLS_PER_MINUTE, OpenFoodFactsThrottle } from "./OpenFoodFactsClient";

describe("OpenFoodFactsClient", () => {
    const fetchMock = vi.fn<typeof fetch>();
    const barcode = "0012345678905";
    let throttle: OpenFoodFactsThrottle;
    let client: OpenFoodFactsClient;

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
        throttle = new OpenFoodFactsThrottle();
        client = new OpenFoodFactsClient(throttle);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.useRealTimers();
    });

    it("calls the v3 product API with the stored fields and a contactable User-Agent", async () => {
        fetchMock.mockResolvedValue(Response.json({ status: "success", product: { product_name: "Riz" } }));

        expect(await client.fetchProduct(barcode)).toMatchObject({
            outcome: "found", httpStatus: 200, product: { product_name: "Riz" },
        });
        expect(fetchMock).toHaveBeenCalledWith(
            `https://world.openfoodfacts.org/api/v3/product/${barcode}?fields=${OPEN_FOOD_FACTS_FIELDS.join(",")}`,
            {
                headers: { "User-Agent": "Chocosous/1.0 (dandrieux.keller@gmail.com)" },
                signal: expect.any(AbortSignal),
            },
        );
    });

    it("lets the contact be configured by environment", async () => {
        vi.stubEnv("OPEN_FOOD_FACTS_CONTACT", "ops@example.org");
        fetchMock.mockResolvedValue(Response.json({ status: "success", product: {} }));
        await client.fetchProduct(barcode);
        expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ "User-Agent": "Chocosous/1.0 (ops@example.org)" });
    });

    it.each([
        [new Response("{}", { status: 404 }), "not_found", 404],
        [Response.json({ status: "failure", product: {} }), "not_found", 200],
        [new Response("oops", { status: 500 }), "http_error", 500],
        [new Response("not json"), "http_error", 200],
    ])("classifies responses without throwing (%#)", async (response, outcome, httpStatus) => {
        fetchMock.mockResolvedValue(response);
        expect(await client.fetchProduct(barcode)).toMatchObject({ outcome, httpStatus, product: null });
    });

    it("reports network errors", async () => {
        fetchMock.mockRejectedValue(new Error("network unavailable"));
        expect(await client.fetchProduct(barcode)).toMatchObject({ outcome: "network_error", httpStatus: null });
    });

    it.each([429, 503])("opens the circuit for 10 minutes after HTTP %i", async (status) => {
        vi.useFakeTimers({ toFake: ["Date"] });
        fetchMock.mockResolvedValue(new Response("slow down", { status }));
        expect(await client.fetchProduct(barcode)).toMatchObject({ outcome: "rate_limited", httpStatus: status });

        expect(await client.fetchProduct(barcode)).toBeNull();
        vi.advanceTimersByTime(10 * 60 * 1000);
        expect(await client.fetchProduct(barcode)).not.toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("never exceeds the local per-minute budget", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        fetchMock.mockImplementation(async () => Response.json({ status: "success", product: {} }));
        for (let index = 0; index < OPEN_FOOD_FACTS_MAX_CALLS_PER_MINUTE; index++) {
            expect(await client.fetchProduct(barcode)).not.toBeNull();
        }
        expect(await client.fetchProduct(barcode)).toBeNull();
        vi.advanceTimersByTime(60_000);
        expect(await client.fetchProduct(barcode)).not.toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(OPEN_FOOD_FACTS_MAX_CALLS_PER_MINUTE + 1);
    });

    it("aborts a slow fetch after three seconds and clears its timer", async () => {
        vi.useFakeTimers();
        let signal: AbortSignal | null = null;
        fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
            signal = options?.signal ?? null;
            signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        }));
        const pending = client.fetchProduct(barcode);
        await vi.advanceTimersByTimeAsync(2999);
        expect(signal?.aborted).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(await pending).toMatchObject({ outcome: "network_error" });
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(["1234567", "123456789012345", "1234abcd", "../12345678", " 12345678"])(
        "never sends invalid barcodes to OFF: %s",
        async (invalid) => {
            expect(await client.fetchProduct(invalid)).toBeNull();
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );
});
