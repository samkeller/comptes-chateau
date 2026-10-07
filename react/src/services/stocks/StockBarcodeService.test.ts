import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import StockBarcodeService from "./StockBarcodeService";
import type { StockBarcodeLookupResponse } from "@chocosous/shared";

vi.mock("axios");

describe("StockBarcodeService", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it("returns the shared lookup response from the authenticated API", async () => {
        const data: StockBarcodeLookupResponse = {
            barcode: "12345678", existingItem: null, suggestion: null,
        };
        vi.mocked(axios.get).mockResolvedValueOnce({ data });
        expect(await new StockBarcodeService().lookup("12345678")).toEqual(data);
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/items/lookup/12345678");
    });
    it("encodes the barcode in the request path", async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });
        await new StockBarcodeService().lookup("../test");
        expect(axios.get).toHaveBeenCalledWith("/api/stocks/items/lookup/..%2Ftest");
    });
    it("propagates API failures instead of interpreting them as unknown products", async () => {
        const error = new Error("API unavailable");
        vi.mocked(axios.get).mockRejectedValueOnce(error);
        await expect(new StockBarcodeService().lookup("12345678")).rejects.toThrow(error);
    });
});
