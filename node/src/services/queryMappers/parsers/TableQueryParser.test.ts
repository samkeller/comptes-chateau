import { describe, expect, it } from "vitest";
import TableQueryParser, { TableQueryValidationError } from "./TableQueryParser";

describe("TableQueryParser", () => {
    const options = {
        allowedSortFields: new Set(["dateOperation", "amount"]),
        allowedFilterFields: new Set(["label", "amount"]),
        defaultTake: 50,
        maxTake: 200
    };

    it("parses pagination, sort and mixed filters", () => {
        const filters = [
            {
                type: "simple",
                field: "label",
                matchMode: "contains",
                value: "rent"
            },
            {
                type: "operator",
                field: "amount",
                operator: "or",
                constraints: [
                    { matchMode: "gt", value: 100 },
                    { matchMode: "lt", value: 20 }
                ]
            }
        ];

        const parsed = TableQueryParser.parse(
            {
                skip: "10",
                take: "25",
                sortField: "amount",
                sortOrder: "DESC",
                filters: JSON.stringify(filters)
            },
            options
        );

        expect(parsed.pagination).toEqual({ skip: 10, take: 25 });
        expect(parsed.sort).toEqual({ field: "amount", direction: "DESC" });
        expect(parsed.filters).toEqual(filters);
    });

    it("uses defaults when query values are missing", () => {
        const parsed = TableQueryParser.parse({}, options);

        expect(parsed.pagination).toEqual({ skip: 0, take: 50 });
        expect(parsed.sort).toBeNull();
        expect(parsed.filters).toEqual([]);
    });

    it("falls back to ASC for unknown sortOrder", () => {
        const parsed = TableQueryParser.parse({ sortField: "dateOperation", sortOrder: "weird" }, options);

        expect(parsed.sort).toEqual({ field: "dateOperation", direction: "ASC" });
    });

    it("throws for disallowed sort field", () => {
        expect(() =>
            TableQueryParser.parse(
                {
                    sortField: "label"
                },
                options
            )
        ).toThrowError(TableQueryValidationError);
    });

    it("throws for disallowed filter field", () => {
        const filters = [
            {
                type: "simple",
                field: "dateOperation",
                matchMode: "equals",
                value: "2026-03-01"
            }
        ];

        expect(() =>
            TableQueryParser.parse(
                {
                    filters: JSON.stringify(filters)
                },
                options
            )
        ).toThrowError(TableQueryValidationError);
    });

    it("throws for invalid filters JSON", () => {
        expect(() => TableQueryParser.parse({ filters: "{nope" }, options)).toThrowError(
            TableQueryValidationError
        );
    });

    it("throws when pagination is outside allowed range", () => {
        expect(() => TableQueryParser.parse({ skip: "-1" }, options)).toThrowError(TableQueryValidationError);
        expect(() => TableQueryParser.parse({ take: "999" }, options)).toThrowError(TableQueryValidationError);
    });
});
