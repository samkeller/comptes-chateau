import { describe, expect, it } from "vitest";
import { DataTableFilterMeta } from "primereact/datatable";
import DataTableQueryCodec, { DataTableLazyState } from "./DataTableQueryCodec";

function buildLazyState(overrides?: Partial<DataTableLazyState>): DataTableLazyState {
    return {
        first: 0,
        rows: 20,
        page: 0,
        sortOrder: 1,
        filters: {},
        ...overrides
    };
}

describe("DataTableQueryCodec", () => {
    it("maps pagination and ascending sort", () => {
        const state = buildLazyState({
            first: 40,
            rows: 20,
            page: 2,
            sortField: "dateOperation",
            sortOrder: 1
        });

        const query = DataTableQueryCodec.toQuery(state);

        expect(query.pagination).toEqual({
            first: 40,
            rows: 20,
            page: 2,
            skip: 40,
            take: 20
        });
        expect(query.sort).toEqual({ field: "dateOperation", direction: "ASC" });
    });

    it("maps descending sort", () => {
        const state = buildLazyState({ sortField: "amount", sortOrder: -1 });

        expect(DataTableQueryCodec.toSort(state)).toEqual({ field: "amount", direction: "DESC" });
    });

    it("returns null sort when no sortField", () => {
        const state = buildLazyState({ sortField: undefined });

        expect(DataTableQueryCodec.toSort(state)).toBeNull();
    });

    it("maps simple filters and ignores empty values", () => {
        const filters: DataTableFilterMeta = {
            label: { value: "rent", matchMode: "contains" },
            amount: { value: "   ", matchMode: "contains" },
            dateOperation: { value: new Date(2026, 2, 3), matchMode: "dateIs" }
        };

        const mapped = DataTableQueryCodec.toFilters(filters);

        expect(mapped).toEqual([
            {
                type: "simple",
                field: "label",
                matchMode: "contains",
                value: "rent"
            },
            {
                type: "simple",
                field: "dateOperation",
                matchMode: "dateIs",
                value: "2026-03-03"
            }
        ]);
    });

    it("maps operator filters and drops empty constraints", () => {
        const filters: DataTableFilterMeta = {
            amount: {
                operator: "or",
                constraints: [
                    { value: 100, matchMode: "equals" },
                    { value: "", matchMode: "equals" },
                    { value: 250, matchMode: "gt" }
                ]
            }
        };

        const mapped = DataTableQueryCodec.toFilters(filters);

        expect(mapped).toEqual([
            {
                type: "operator",
                field: "amount",
                operator: "or",
                constraints: [
                    { matchMode: "equals", value: 100 },
                    { matchMode: "gt", value: 250 }
                ]
            }
        ]);
    });

    it("serializes filters to query params", () => {
        const state = buildLazyState({
            first: 10,
            rows: 10,
            sortField: "dateValeur",
            sortOrder: -1,
            filters: {
                label: { value: "foo", matchMode: "contains" }
            }
        });

        const params = DataTableQueryCodec.toQueryParams(state);

        expect(params.get("skip")).toBe("10");
        expect(params.get("take")).toBe("10");
        expect(params.get("sortField")).toBe("dateValeur");
        expect(params.get("sortOrder")).toBe("DESC");
        expect(params.get("filters")).toBe(
            JSON.stringify([
                {
                    type: "simple",
                    field: "label",
                    matchMode: "contains",
                    value: "foo"
                }
            ])
        );
    });
});
