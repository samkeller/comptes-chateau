import { describe, expect, it } from "vitest";
import { SaveNatureSchema } from "./operation/AccountLineNatureDto";
import { SavePosteSchema } from "./operation/AccountLinePosteDtos";

describe("Setup validation schemas", () => {
    it("rejects whitespace-only nature label", () => {
        const parsed = SaveNatureSchema.safeParse({
            label: "   ",
            color: "#112233",
            isHorsCompte: false,
        });

        expect(parsed.success).toBe(false);
    });

    it("trims valid nature label", () => {
        const parsed = SaveNatureSchema.safeParse({
            label: "  Courses  ",
            color: "#112233",
            isHorsCompte: false,
        });

        expect(parsed.success).toBe(true);
        if (!parsed.success) {
            return;
        }

        expect(parsed.data.label).toBe("Courses");
    });

    it("rejects whitespace-only poste label", () => {
        const parsed = SavePosteSchema.safeParse({
            label: "   ",
            color: "#112233",
        });

        expect(parsed.success).toBe(false);
    });

    it("trims valid poste label", () => {
        const parsed = SavePosteSchema.safeParse({
            label: "  Maison  ",
            color: "#112233",
        });

        expect(parsed.success).toBe(true);
        if (!parsed.success) {
            return;
        }

        expect(parsed.data.label).toBe("Maison");
    });
});
