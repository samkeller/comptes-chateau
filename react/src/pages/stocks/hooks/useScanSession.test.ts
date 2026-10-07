import { describe, expect, it } from "vitest";
import { createScanForm, isSafeImageUrl } from "./useScanSession";

describe("stock scan image URLs", () => {
    it.each(["", "https://example.org/image.jpg", "http://example.org/image.jpg"])(
        "accepts an optional web URL: %s", value => {
            expect(isSafeImageUrl(value)).toBe(true);
        }
    );
    it.each(["not a URL", "javascript:alert(1)", "data:image/svg+xml,test", "file:///tmp/image.jpg"])(
        "rejects unsupported URLs: %s", value => {
            expect(isSafeImageUrl(value)).toBe(false);
        }
    );
});

describe("stock scan prefilling", () => {
    it("requires explicit units for an OFF quantity with an unknown unit", () => {
        const form = createScanForm({
            barcode: "12345678", existingItem: null,
            suggestion: { label: "Produit", brand: null, imageUrl: null, quantity: 10, unit: null },
        });
        expect(form.quantity).toBe(10);
        expect(form.defaultUnit).toBe("");
        expect(form.unit).toBe("");
    });
    it("uses the suggested quantity and recognized unit together", () => {
        const form = createScanForm({
            barcode: "12345678", existingItem: null,
            suggestion: { label: "Produit", brand: null, imageUrl: null, quantity: 500, unit: "g" },
        });
        expect(form).toMatchObject({ quantity: 500, defaultUnit: "g", unit: "g", copies: 1 });
    });
    it("preserves existing values including nonstandard units without substituting OFF data", () => {
        const form = createScanForm({
            barcode: "12345678", existingItem: {
                id: 1, barcode: "12345678", label: "Produit existant", defaultUnit: "pièce",
                imageUrl: null, stockUnitsCount: 2, nextStockUnitExpiration: null, createdAt: "2026-01-01",
            }, suggestion: null,
        });
        expect(form).toMatchObject({
            label: "Produit existant", defaultUnit: "pièce", unit: "pièce", imageUrl: "", quantity: 1,
        });
    });
    it("opens an empty manual form when neither source knows the product", () => {
        expect(createScanForm({ barcode: "12345678", existingItem: null, suggestion: null }))
            .toMatchObject({ barcode: "12345678", label: "", quantity: 1, defaultUnit: "pack" });
    });
});
