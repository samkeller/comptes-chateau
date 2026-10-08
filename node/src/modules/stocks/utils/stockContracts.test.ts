import { describe, expect, it } from "vitest";
import {
    barcodeVariants,
    getStockExpiryState,
    normalizeBarcode,
    normalizeStockUnit,
    parseStockUnit,
    SaveStockEntrySchema,
} from "@chocosous/shared";

/** Contrats partagés front/back du module stocks. */
describe("stock shared contracts", () => {
    it.each([
        ["12345678", "12345678"],
        ["012345678905", "0012345678905"],
        ["0012345678905", "0012345678905"],
        ["00012345678905", "0012345678905"],
        [" 3017 6204-22003 ", "3017620422003"],
        ["1234567", null],
        ["12ab5678", null],
    ])("normalizeBarcode(%j) = %j", (input, expected) => {
        expect(normalizeBarcode(input)).toBe(expected);
    });

    it("lists the historical forms of a normalized barcode", () => {
        expect(barcodeVariants("012345678905")).toEqual(["0012345678905", "00012345678905", "012345678905"]);
        expect(barcodeVariants("12345678")).toEqual(["12345678"]);
        expect(barcodeVariants("oops")).toEqual([]);
    });

    it("maps unit aliases and keeps unknown legacy units readable", () => {
        expect(parseStockUnit(" l ")).toBe("L");
        expect(parseStockUnit("Boîte")).toBe("pièce");
        expect(parseStockUnit("brouette")).toBeNull();
        expect(normalizeStockUnit("brouette")).toBe("pièce");
    });

    it.each([
        [null, "none"],
        ["2026-10-07", "expired"],
        ["2026-10-08", "soon"],
        ["2026-11-07", "soon"],
        ["2026-11-08", "ok"],
    ] as const)("expiry state of %s is %s", (date, state) => {
        expect(getStockExpiryState(date, "2026-10-08", "2026-11-07")).toBe(state);
    });

    it("normalizes the barcode and treats an empty one as absent", () => {
        const parsed = SaveStockEntrySchema.parse({ item: { label: " Riz ", defaultUnit: "g", barcode: "012345678905" }, lots: [] });
        expect(parsed.item).toMatchObject({ label: "Riz", barcode: "0012345678905" });
        expect(SaveStockEntrySchema.parse({ item: { label: "Riz", defaultUnit: "g", barcode: " " }, lots: [] }).item.barcode).toBeNull();
    });

    it("rejects a unit id listed in two lots", () => {
        const lot = { unitIds: [1], copies: 1, locationId: 1, quantity: 1, unit: "g", expirationDate: null };
        expect(SaveStockEntrySchema.safeParse({ item: { id: 1, label: "Riz", defaultUnit: "g" }, lots: [lot, lot] }).success).toBe(false);
    });
});
