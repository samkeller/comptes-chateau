import { describe, expect, it } from "vitest";
import { getLocalExpiryState, STOCK_EXPIRY_DISPLAY } from "./stockExpiry";

describe("getLocalExpiryState", () => {
    const now = new Date(2026, 9, 8, 23, 30);

    it("compares calendar days like the server (today is not expired)", () => {
        expect(getLocalExpiryState(new Date(2026, 9, 7, 23, 59), now)).toBe("expired");
        expect(getLocalExpiryState(new Date(2026, 9, 8), now)).toBe("soon");
        expect(getLocalExpiryState(new Date(2026, 10, 7), now)).toBe("soon");
        expect(getLocalExpiryState(new Date(2026, 10, 8), now)).toBe("ok");
        expect(getLocalExpiryState(null, now)).toBe("none");
    });

    it("only colors states that need an action", () => {
        expect(STOCK_EXPIRY_DISPLAY.ok.severity).toBeNull();
        expect(STOCK_EXPIRY_DISPLAY.none.severity).toBeNull();
        expect(STOCK_EXPIRY_DISPLAY.expired.severity).toBe("danger");
        expect(STOCK_EXPIRY_DISPLAY.soon.severity).toBe("warning");
    });
});
