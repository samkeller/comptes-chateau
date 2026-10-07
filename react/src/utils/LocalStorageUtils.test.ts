import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocalStorageUtils, { LOCAL_STORAGE_KEYS } from "./LocalStorageUtils";

describe("scan location persistence", () => {
    let records: Map<string, string>;
    beforeEach(() => {
        records = new Map();
        vi.stubGlobal("window", {
            localStorage: {
                getItem: (key: string) => records.get(key) ?? null,
                setItem: (key: string, value: string) => { records.set(key, value); },
                removeItem: (key: string) => { records.delete(key); },
            },
        });
    });
    afterEach(() => { vi.unstubAllGlobals(); });

    it("persists the selected location across instances with an expiry timestamp", () => {
        new LocalStorageUtils().setScanLocationId(42);
        expect(new LocalStorageUtils().getScanLocationId()).toBe(42);
        expect(JSON.parse(records.get(LOCAL_STORAGE_KEYS.SCAN_LOCATION_ID) ?? "{}"))
            .toEqual({ value: "42", timestamp: expect.any(Number) });
    });
    it("expires a location after thirty days", () => {
        records.set(LOCAL_STORAGE_KEYS.SCAN_LOCATION_ID, JSON.stringify({
            value: "42", timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        }));
        expect(new LocalStorageUtils().getScanLocationId()).toBeNull();
        expect(records.has(LOCAL_STORAGE_KEYS.SCAN_LOCATION_ID)).toBe(false);
    });
    it.each(["not json", '{"value":"-1","timestamp":0}', '{"value":"abc","timestamp":0}'])(
        "ignores invalid storage: %s", raw => {
            records.set(LOCAL_STORAGE_KEYS.SCAN_LOCATION_ID, raw);
            expect(new LocalStorageUtils().getScanLocationId()).toBeNull();
        }
    );
    it("does not block stock entry when storage is denied", () => {
        vi.stubGlobal("window", { localStorage: {
            getItem: () => { throw new Error("denied"); },
            setItem: () => { throw new Error("denied"); },
        } });
        expect(new LocalStorageUtils().getScanLocationId()).toBeNull();
        expect(() => new LocalStorageUtils().setScanLocationId(42)).not.toThrow();
    });
});
