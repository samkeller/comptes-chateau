import { describe, expect, it, vi } from "vitest";
import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import TableQueryMapper, { TableFilterHandler, TableSortHandler } from "./TableQueryMapper";
import { ParsedTableFilter, ParsedTableQuerySort } from "./parsers/TableQueryParser";

class MockQueryBuilder<TEntity extends ObjectLiteral> {
    public orderByCalls: Array<{ field: string; direction: "ASC" | "DESC" }> = [];

    orderBy(field: string, direction: "ASC" | "DESC"): this {
        this.orderByCalls.push({ field, direction });
        return this;
    }

    addOrderBy(field: string, direction: "ASC" | "DESC"): this {
        this.orderByCalls.push({ field, direction });
        return this;
    }
}

describe("TableQueryMapper", () => {
    it("applies requested sort handler", () => {
        const qb = new MockQueryBuilder<ObjectLiteral>();
        const defaultSort = { field: "dateOperation", direction: "DESC" as const };

        const amountHandler: TableSortHandler<ObjectLiteral> = {
            apply: vi.fn((builder, direction) => {
                (builder as unknown as MockQueryBuilder<ObjectLiteral>).orderBy("amountSql", direction);
            })
        };

        const sortHandlers = {
            dateOperation: {
                apply: vi.fn()
            },
            amount: amountHandler
        };

        const sort: ParsedTableQuerySort = { field: "amount", direction: "ASC" };

        TableQueryMapper.applySort(
            qb as unknown as SelectQueryBuilder<ObjectLiteral>,
            sort,
            sortHandlers,
            defaultSort
        );

        expect(amountHandler.apply).toHaveBeenCalledOnce();
        expect(qb.orderByCalls).toEqual([{ field: "amountSql", direction: "ASC" }]);
    });

    it("applies default sort when sort is null", () => {
        const qb = new MockQueryBuilder<ObjectLiteral>();
        const defaultHandler: TableSortHandler<ObjectLiteral> = {
            apply: vi.fn((builder, direction) => {
                (builder as unknown as MockQueryBuilder<ObjectLiteral>).orderBy("al.dateOperation", direction);
            })
        };

        TableQueryMapper.applySort(
            qb as unknown as SelectQueryBuilder<ObjectLiteral>,
            null,
            {
                dateOperation: defaultHandler
            },
            { field: "dateOperation", direction: "DESC" }
        );

        expect(defaultHandler.apply).toHaveBeenCalledOnce();
        expect(qb.orderByCalls).toEqual([{ field: "al.dateOperation", direction: "DESC" }]);
    });

    it("dispatches simple and operator filters to matching handlers", () => {
        const qb = {} as SelectQueryBuilder<ObjectLiteral>;
        const simpleApply = vi.fn();
        const operatorApply = vi.fn();

        const filters: ParsedTableFilter[] = [
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
                constraints: [{ matchMode: "gt", value: 100 }]
            },
            {
                type: "simple",
                field: "unknown",
                matchMode: "equals",
                value: "x"
            }
        ];

        const handlers: Record<string, TableFilterHandler<ObjectLiteral>> = {
            label: {
                applySimple: simpleApply
            },
            amount: {
                applyOperator: operatorApply
            }
        };

        TableQueryMapper.applyFilters(qb, filters, handlers);

        expect(simpleApply).toHaveBeenCalledTimes(1);
        expect(operatorApply).toHaveBeenCalledTimes(1);
        expect(simpleApply).toHaveBeenCalledWith(qb, filters[0]);
        expect(operatorApply).toHaveBeenCalledWith(qb, filters[1]);
    });
});
