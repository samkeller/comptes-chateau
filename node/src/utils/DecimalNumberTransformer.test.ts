import { describe, expect, it } from "vitest";
import { decimalNumberTransformer } from "./DecimalNumberTransformer";

describe("decimalNumberTransformer", () => {
    it("converts PostgreSQL decimal strings to numbers", () => {
        expect(decimalNumberTransformer.from("-25.50")).toBe(-25.5);
    });

    it("preserves null values", () => {
        expect(decimalNumberTransformer.from(null)).toBeNull();
    });
});