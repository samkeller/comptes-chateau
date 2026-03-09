import { describe, expect, it } from "vitest";
import { Brackets } from "typeorm";
import operationTableQueryConfig from "./operationTableQueryConfig";

type Direction = "ASC" | "DESC";

type WhereCall = {
    kind: "and" | "or";
    sql: string;
    params?: Record<string, unknown>;
};

class MockQueryBuilder {
    public addSelectCalls: Array<{ sql: string; alias: string }> = [];
    public orderByCalls: Array<{ method: "orderBy" | "addOrderBy"; sql: string; direction: Direction }> = [];
    public whereCalls: WhereCall[] = [];

    addSelect(sql: string, alias: string): this {
        this.addSelectCalls.push({ sql, alias });
        return this;
    }

    orderBy(sql: string, direction: Direction): this {
        this.orderByCalls.push({ method: "orderBy", sql, direction });
        return this;
    }

    addOrderBy(sql: string, direction: Direction): this {
        this.orderByCalls.push({ method: "addOrderBy", sql, direction });
        return this;
    }

    andWhere(sqlOrBrackets: unknown, params?: Record<string, unknown>): this {
        this.applyWhere("and", sqlOrBrackets, params);
        return this;
    }

    orWhere(sqlOrBrackets: unknown, params?: Record<string, unknown>): this {
        this.applyWhere("or", sqlOrBrackets, params);
        return this;
    }

    private applyWhere(kind: "and" | "or", sqlOrBrackets: unknown, params?: Record<string, unknown>): void {
        if (sqlOrBrackets instanceof Brackets) {
            const nested = new MockQueryBuilder();
            const maybeWhereFactory = sqlOrBrackets as unknown as {
                whereFactory?: (qb: MockQueryBuilder) => void;
            };

            if (typeof maybeWhereFactory.whereFactory === "function") {
                maybeWhereFactory.whereFactory(nested);
            }

            this.whereCalls.push(...nested.whereCalls);
            return;
        }

        this.whereCalls.push({
            kind,
            sql: String(sqlOrBrackets),
            params
        });
    }
}

describe("operationTableQueryConfig", () => {
    it("sorts amount with SQL expression and tie-breaker", () => {
        const qb = new MockQueryBuilder();

        operationTableQueryConfig.sortHandlers.amount.apply(qb as never, "DESC");

        expect(qb.addSelectCalls).toEqual([{ sql: "(al.credit - al.debit)", alias: "amount_sort" }]);

        expect(qb.orderByCalls).toEqual([
            {
                method: "orderBy",
                sql: "amount_sort",
                direction: "DESC"
            },
            {
                method: "addOrderBy",
                sql: "al.id",
                direction: "DESC"
            }
        ]);
    });

    it("sorts amount in ASC direction too", () => {
        const qb = new MockQueryBuilder();

        operationTableQueryConfig.sortHandlers.amount.apply(qb as never, "ASC");

        expect(qb.addSelectCalls).toEqual([{ sql: "(al.credit - al.debit)", alias: "amount_sort" }]);

        expect(qb.orderByCalls).toEqual([
            {
                method: "orderBy",
                sql: "amount_sort",
                direction: "ASC"
            },
            {
                method: "addOrderBy",
                sql: "al.id",
                direction: "ASC"
            }
        ]);
    });

    it("maps label simple filters: contains, equals, notEquals and in", () => {
        const qb = new MockQueryBuilder();
        const labelHandler = operationTableQueryConfig.filterHandlers.label;

        labelHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "label",
            matchMode: "contains",
            value: "rent"
        });
        labelHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "label",
            matchMode: "equals",
            value: "EDF"
        });
        labelHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "label",
            matchMode: "notEquals",
            value: "Amazon"
        });
        labelHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "label",
            matchMode: "in",
            value: ["A", "B"]
        });

        expect(qb.whereCalls).toEqual([
            {
                kind: "and",
                sql: "al.label ILIKE :labelSimple ESCAPE '\\'",
                params: { labelSimple: "%rent%" }
            },
            {
                kind: "and",
                sql: "al.label = :labelSimple",
                params: { labelSimple: "EDF" }
            },
            {
                kind: "and",
                sql: "al.label <> :labelSimple",
                params: { labelSimple: "Amazon" }
            },
            {
                kind: "and",
                sql: "al.label IN (:...labelSimple)",
                params: { labelSimple: ["A", "B"] }
            }
        ]);
    });

    it("maps date simple filters: between, dateBefore, dateAfter", () => {
        const qb = new MockQueryBuilder();
        const dateHandler = operationTableQueryConfig.filterHandlers.dateOperation;

        dateHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "dateOperation",
            matchMode: "between",
            value: ["2026-03-01", "2026-03-31"]
        });
        dateHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "dateOperation",
            matchMode: "dateBefore",
            value: "2026-03-10"
        });
        dateHandler.applySimple?.(qb as never, {
            type: "simple",
            field: "dateOperation",
            matchMode: "dateAfter",
            value: "2026-03-05"
        });

        expect(qb.whereCalls[0].sql).toBe("al.dateOperation BETWEEN :dateOperationFromSimple AND :dateOperationToSimple");
        expect(qb.whereCalls[1]).toMatchObject({
            kind: "and",
            sql: "al.dateOperation < :dateOperationSimple"
        });
        expect(qb.whereCalls[2]).toMatchObject({
            kind: "and",
            sql: "al.dateOperation > :dateOperationSimple"
        });
    });

    it("maps operator constraints with OR for amount", () => {
        const qb = new MockQueryBuilder();
        const amountHandler = operationTableQueryConfig.filterHandlers.amount;

        amountHandler.applyOperator?.(qb as never, {
            type: "operator",
            field: "amount",
            operator: "or",
            constraints: [
                { matchMode: "equals", value: 100 },
                { matchMode: "between", value: [200, 400] }
            ]
        });

        expect(qb.whereCalls).toEqual([
            {
                kind: "or",
                sql: "(al.credit - al.debit) = :amount0",
                params: { amount0: 100 }
            },
            {
                kind: "or",
                sql: "(al.credit - al.debit) BETWEEN :amount1Min AND :amount1Max",
                params: { amount1Min: 200, amount1Max: 400 }
            }
        ]);
    });

    it("maps operator constraints with AND for amount", () => {
        const qb = new MockQueryBuilder();
        const amountHandler = operationTableQueryConfig.filterHandlers.amount;

        amountHandler.applyOperator?.(qb as never, {
            type: "operator",
            field: "amount",
            operator: "and",
            constraints: [
                { matchMode: "gte", value: 100 },
                { matchMode: "lte", value: 500 }
            ]
        });

        expect(qb.whereCalls).toEqual([
            {
                kind: "and",
                sql: "(al.credit - al.debit) >= :amount0",
                params: { amount0: 100 }
            },
            {
                kind: "and",
                sql: "(al.credit - al.debit) <= :amount1",
                params: { amount1: 500 }
            }
        ]);
    });

    it("maps business fields nature.label, poste.label and isChecked", () => {
        const qb = new MockQueryBuilder();

        operationTableQueryConfig.filterHandlers["nature.label"].applySimple?.(qb as never, {
            type: "simple",
            field: "nature.label",
            matchMode: "equals",
            value: 12
        });
        operationTableQueryConfig.filterHandlers["poste.label"].applySimple?.(qb as never, {
            type: "simple",
            field: "poste.label",
            matchMode: "equals",
            value: 8
        });
        operationTableQueryConfig.filterHandlers.isChecked.applySimple?.(qb as never, {
            type: "simple",
            field: "isChecked",
            matchMode: "equals",
            value: true
        });

        operationTableQueryConfig.filterHandlers.isChecked.applySimple?.(qb as never, {
            type: "simple",
            field: "isChecked",
            matchMode: "equals",
            value: "false"
        });

        expect(qb.whereCalls).toEqual([
            {
                kind: "and",
                sql: "nature.id = :natureIdSimple",
                params: { natureIdSimple: 12 }
            },
            {
                kind: "and",
                sql: "poste.id = :posteIdSimple",
                params: { posteIdSimple: 8 }
            },
            {
                kind: "and",
                sql: "al.isChecked = :isCheckedSimple",
                params: { isCheckedSimple: true }
            },
            {
                kind: "and",
                sql: "al.isChecked = :isCheckedSimple",
                params: { isCheckedSimple: false }
            }
        ]);
    });

    it("maps relation null filters to IS NULL / IS NOT NULL", () => {
        const qb = new MockQueryBuilder();

        operationTableQueryConfig.filterHandlers["nature.label"].applySimple?.(qb as never, {
            type: "simple",
            field: "nature.label",
            matchMode: "equals",
            value: "null"
        });
        operationTableQueryConfig.filterHandlers["poste.label"].applySimple?.(qb as never, {
            type: "simple",
            field: "poste.label",
            matchMode: "notEquals",
            value: "null"
        });

        expect(qb.whereCalls).toEqual([
            {
                kind: "and",
                sql: "nature.id IS NULL",
                params: undefined
            },
            {
                kind: "and",
                sql: "poste.id IS NOT NULL",
                params: undefined
            }
        ]);
    });
});
