import { describe, expect, it } from "vitest";
import QueryParamsParser, { QueryParamsValidationError } from "./QueryParamsParser";
import DashboardMonthlyByPosteQueryParser from "./DashboardMonthlyByPosteQueryParser";

describe("QueryParamsParser", () => {
    it("parses typed schema values", () => {
        const parsed = QueryParamsParser.parse(
            {
                from: "2026-01-01",
                to: "2026-02-28",
                posteIds: "1,2,10"
            },
            {
                from: QueryParamsParser.requiredDate,
                to: QueryParamsParser.requiredDate,
                posteIds: QueryParamsParser.requiredCsvIntegerList
            }
        );

        expect(parsed.from).toEqual(new Date(2026, 0, 1));
        expect(parsed.to).toEqual(new Date(2026, 1, 28));
        expect(parsed.posteIds).toEqual([1, 2, 10]);
    });

    it("throws for missing required field", () => {
        expect(() =>
            QueryParamsParser.parse(
                {
                    from: "2026-01-01"
                },
                {
                    from: QueryParamsParser.requiredDate,
                    to: QueryParamsParser.requiredDate
                }
            )
        ).toThrowError(QueryParamsValidationError);
    });

    it("throws for invalid csv integer list", () => {
        expect(() => QueryParamsParser.requiredCsvIntegerList("1,a,3", "posteIds")).toThrowError(
            QueryParamsValidationError
        );
    });
});

describe("DashboardMonthlyByPosteQueryParser", () => {
    it("throws when from is after to", () => {
        expect(() =>
            DashboardMonthlyByPosteQueryParser.parse({
                from: "2026-03-01",
                to: "2026-02-01",
                posteIds: "1,2"
            })
        ).toThrowError(QueryParamsValidationError);
    });
});
