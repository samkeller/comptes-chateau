import { describe, expect, it } from "vitest";
import { toProductSuggestion } from "./openFoodFactsSuggestion";

describe("toProductSuggestion", () => {
    it("maps and trims OFF fields, preferring the French name and the first brand", () => {
        expect(toProductSuggestion({
            product_name: "dark chocolate",
            product_name_fr: "  chocolat Noir  ",
            brands: "  Choco , Other ",
            image_front_small_url: " https://images.openfoodfacts.org/choco.jpg ",
            product_quantity: 100,
            product_quantity_unit: "g",
        })).toEqual({
            label: "Chocolat Noir",
            brand: "Choco",
            imageUrl: "https://images.openfoodfacts.org/choco.jpg",
            quantity: 100,
            unit: "g",
        });
    });

    it.each([["g", "g"], ["kg", "kg"], ["ml", "ml"], ["cl", "cl"], ["l", "L"], ["L", "L"]])(
        "maps the unit %s to %s",
        (input, expected) => {
            expect(toProductSuggestion({ product_quantity: "1.5", product_quantity_unit: input }))
                .toMatchObject({ quantity: 1.5, unit: expected });
        },
    );

    it.each([" 1,5 L ", "1.5 l"])("uses a simple textual quantity fallback: %s", (quantity) => {
        expect(toProductSuggestion({ quantity })).toMatchObject({ quantity: 1.5, unit: "L" });
    });

    it("falls back to the textual quantity when the structured one is invalid", () => {
        expect(toProductSuggestion({ product_quantity: -1, product_quantity_unit: "g", quantity: "500 g" }))
            .toMatchObject({ quantity: 500, unit: "g" });
    });

    it("never infers multipacks nor keeps a quantity without a known unit", () => {
        expect(toProductSuggestion({ quantity: "6 x 100 g" })).toMatchObject({ quantity: null, unit: null });
        expect(toProductSuggestion({ product_quantity: 4, product_quantity_unit: "oz" })).toMatchObject({ quantity: null, unit: null });
        // « pièce » n'est pas une unité de contenu OFF.
        expect(toProductSuggestion({ product_quantity: 6, product_quantity_unit: "pcs" })).toMatchObject({ quantity: null, unit: null });
    });

    it("drops non-http images and malformed values without losing the product", () => {
        expect(toProductSuggestion({
            product_name: 42, brands: ["x"], image_front_small_url: "javascript:alert(1)", image_front_url: "not a url",
        })).toEqual({ label: null, brand: null, imageUrl: null, quantity: null, unit: null });
        expect(toProductSuggestion({ image_front_url: "https://img/front.jpg" }).imageUrl).toBe("https://img/front.jpg");
    });

    it("caps the label length", () => {
        expect(toProductSuggestion({ product_name: "a".repeat(300) }).label).toHaveLength(255);
    });
});
