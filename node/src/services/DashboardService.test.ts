import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardService from "./DashboardService";

type QueryResult = { value: string | number } | undefined;

type WhereCall = {
    sql: string;
    params?: Record<string, unknown>;
};

class MockBalanceDeltaQueryBuilder {
    public selectCalls: Array<{ sql: string; alias: string }> = [];
    public whereCalls: WhereCall[] = [];
    public andWhereCalls: WhereCall[] = [];
    public leftJoinCalls: Array<{ relation: string; alias: string }> = [];
    public getRawOneCalls = 0;
    public rawResult: QueryResult;

    select(sql: string, alias: string): this {
        this.selectCalls.push({ sql, alias });
        return this;
    }

    where(sql: string, params?: Record<string, unknown>): this {
        this.whereCalls.push({ sql, params });
        return this;
    }

    andWhere(sql: string, params?: Record<string, unknown>): this {
        this.andWhereCalls.push({ sql, params });
        return this;
    }

    leftJoin(relation: string, alias: string): this {
        this.leftJoinCalls.push({ relation, alias });
        return this;
    }

    getRawOne<T>(): Promise<T> {
        this.getRawOneCalls += 1;
        return Promise.resolve(this.rawResult as T);
    }
}

interface DashboardServicePrivate {
    getBalanceDeltaSinceDate(checkedOnly: boolean, fromDate: Date): Promise<QueryResult>;
}

describe("DashboardService.getBalanceDeltaSinceDate", () => {
    let qb: MockBalanceDeltaQueryBuilder;
    let createQueryBuilder: ReturnType<typeof vi.fn>;
    let service: DashboardService;

    beforeEach(() => {
        qb = new MockBalanceDeltaQueryBuilder();
        createQueryBuilder = vi.fn(() => qb);

        const accountingLineRepo = {
            createQueryBuilder
        };

        service = new DashboardService(
            accountingLineRepo as never,
            {} as never,
            {} as never
        );
    });

    it("builds query with fromDate, hors-compte exclusion and checked filter", async () => {
        const fromDate = new Date("2026-01-15T00:00:00.000Z");
        qb.rawResult = { value: "42.5" };

        const result = await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(true, fromDate);

        expect(createQueryBuilder).toHaveBeenCalledWith("al");
        expect(qb.selectCalls).toEqual([
            {
                sql: "COALESCE(SUM(al.credit - al.debit), 0)",
                alias: "value"
            }
        ]);
        expect(qb.whereCalls).toEqual([
            {
                sql: "al.dateOperation >= :fromDate",
                params: { fromDate }
            }
        ]);
        expect(qb.leftJoinCalls).toEqual([{ relation: "al.nature", alias: "nature" }]);
        expect(qb.andWhereCalls).toEqual([
            {
                sql: "nature.isHorsCompte = false",
                params: undefined
            },
            {
                sql: "al.isChecked = :isChecked",
                params: { isChecked: true }
            }
        ]);
        expect(qb.getRawOneCalls).toBe(1);
        expect(result).toEqual({ value: "42.5" });
    });

    it("does not add checked filter when checkedOnly is false", async () => {
        const fromDate = new Date("2026-02-01T00:00:00.000Z");
        qb.rawResult = { value: 0 };

        const result = await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(false, fromDate);

        expect(qb.whereCalls).toEqual([
            {
                sql: "al.dateOperation >= :fromDate",
                params: { fromDate }
            }
        ]);
        expect(qb.andWhereCalls).toEqual([
            {
                sql: "nature.isHorsCompte = false",
                params: undefined
            }
        ]);
        expect(qb.getRawOneCalls).toBe(1);
        expect(result).toEqual({ value: 0 });
    });
});
