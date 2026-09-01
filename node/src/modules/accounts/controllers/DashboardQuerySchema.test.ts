import { describe, expect, it } from "vitest";
import { DashboardMonthlyByPosteQuerySchema } from "../../../../../shared/src/contracts/accounts/DashboardDtos";

describe("DashboardMonthlyByPosteQuerySchema", () => {
    it("converts CSV poste IDs and date strings", () => {
        const query = DashboardMonthlyByPosteQuerySchema.parse({
            from: "2026-01-01",
            to: "2026-02-28",
            posteIds: "4, 9,12",
        });

        expect(query.posteIds).toEqual([4, 9, 12]);
        expect(query.from).toEqual(new Date(2026, 0, 1));
        expect(query.to).toEqual(new Date(2026, 1, 28));
    });

    it.each([
        {},
        { from: "2026-01-01", to: "2026-02-28" },
        { from: "2026/01/01", to: "2026-02-28", posteIds: "4" },
        { from: "2026-01-01", to: "2026-02-28", posteIds: "4,invalid" },
    ])("rejects missing or invalid query fields", (query) => {
        expect(() => DashboardMonthlyByPosteQuerySchema.parse(query)).toThrow();
    });

    it("rejects a range whose start date is after its end date", () => {
        expect(() => DashboardMonthlyByPosteQuerySchema.parse({
            from: "2026-03-01",
            to: "2026-02-28",
            posteIds: "4",
        })).toThrow();
    });
});
