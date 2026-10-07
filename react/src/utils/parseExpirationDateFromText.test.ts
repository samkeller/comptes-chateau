import { describe, expect, it } from "vitest";
import { parseExpirationDateFromText } from "./parseExpirationDateFromText";

const now = new Date(2026, 9, 7);
const parse = (text: string): Date | null => parseExpirationDateFromText(text, now);

describe("parseExpirationDateFromText", () => {
    it.each([
        ["DLC 31/12/2026", new Date(2026, 11, 31)],
        ["DDM 31.12.2026", new Date(2026, 11, 31)],
        ["EXP 31-12-26", new Date(2026, 11, 31)],
        ["BB 31/12/26", new Date(2026, 11, 31)],
        ["DLC : 31/12/2026.", new Date(2026, 11, 31)],
        ["À consommer de préférence avant fin 02/2028", new Date(2028, 1, 29)],
        ["À consommer avant fin 02/27", new Date(2027, 1, 28)],
        ["DLC OI / l2 / 2O26", new Date(2026, 11, 1)],
        ["EXP 3 1 / 1 2 / 2 0 2 6", new Date(2026, 11, 31)],
        ["07/10/2025", new Date(2025, 9, 7)],
        ["07/10/2041", new Date(2041, 9, 7)],
    ])("parses %s as a local calendar date", (text, expected) => {
        expect(parse(text)).toEqual(expected);
    });

    it.each([
        "", "aucune date", "31/02/2027", "29/02/2027", "00/12/26", "12/00/26",
        "12/13/26", "13/2026", "06/10/2025", "08/10/2041", "12/1999",
        "12/99", "12/20260", "1231/12/2026", "LOT31/12/2026ABC", "10/20/30/40",
    ])("rejects invalid, embedded or implausible dates: %s", (text) => {
        expect(parse(text)).toBeNull();
    });

    it("selects the latest plausible candidate among production dates, expiry dates and noise", () => {
        expect(parse("LOT 123456\nFab. 01/12/2025\nDLC 31/12/2026\nEXP 02/2027\nBB 01/01/2099"))
            .toEqual(new Date(2027, 1, 28));
    });

    it("does not reinterpret the tail of an invalid full date as a month", () => {
        expect(parse("31/02/2027\nDLC 01/12/2026")).toEqual(new Date(2026, 11, 1));
    });

    it("keeps the latest candidate when dates share one line without labels", () => {
        expect(parse("31/12/2027 30/11/2026")).toEqual(new Date(2027, 11, 31));
        expect(parse("12/27 11/26")).toEqual(new Date(2027, 11, 31));
    });

    it("handles leap-year dates and month-end without rolling over", () => {
        expect(parse("29/02/2028")).toEqual(new Date(2028, 1, 29));
        expect(parse("04/2027")).toEqual(new Date(2027, 3, 30));
    });

    it("rejects an invalid reference date", () => {
        expect(parseExpirationDateFromText("31/12/2026", new Date("invalid"))).toBeNull();
    });
});
