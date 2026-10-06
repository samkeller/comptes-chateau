import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStockSeverity } from "./StockSeverity";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockItem from "@/interfaces/stocks/StockItem";

describe("stock expiration severity", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 6, 12));
    });

    afterEach(() => vi.useRealTimers());

    it("preserves danger and warning thresholds and removes info", () => {
        expect(getStockSeverity(new Date(2026, 9, 5))).toBe("error");
        expect(getStockSeverity(new Date(2026, 9, 6, 12))).toBe("error");
        expect(getStockSeverity(new Date(2026, 9, 7))).toBe("warn");
        const horizon = Date.now() + 30 * 24 * 60 * 60 * 1000;
        expect(getStockSeverity(new Date(horizon))).toBe("warn");
        expect(getStockSeverity(new Date(horizon + 1))).toBeNull();
        expect(getStockSeverity(null)).toBeNull();
    });

    it("shares the same alert-only severity between products and lots", () => {
        for (const date of [null, new Date(2026, 9, 5), new Date(2026, 9, 7), new Date(2027, 0, 1)]) {
            expect(new StockUnit({ expirationDate: date }).severity).toBe(getStockSeverity(date));
            expect(new StockItem({ nextStockUnitExpiration: date }).severity).toBe(getStockSeverity(date));
        }
    });
});