import { describe, expect, it } from "vitest";
import DashboardMonthlyByPosteQueryCodec from "./DashboardMonthlyByPosteQueryCodec";

describe("DashboardMonthlyByPosteQueryCodec", () => {
    it("serializes from/to/posteIds", () => {
        const params = DashboardMonthlyByPosteQueryCodec.toQueryParams({
            from: new Date(2026, 0, 1),
            to: new Date(2026, 1, 28),
            posteIds: [4, 9, 12]
        });

        expect(params.get("from")).toBe("2026-01-01");
        expect(params.get("to")).toBe("2026-02-28");
        expect(params.get("posteIds")).toBe("4,9,12");
    });
});
