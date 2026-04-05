import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardService, { DashboardOverview } from "./DashboardService";

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

class MockOverviewQueryBuilder {
    private results: QueryResult[];
    private callIndex = 0;

    constructor(results: QueryResult[]) {
        this.results = results;
    }

    select(): this { return this; }
    addSelect(): this { return this; }
    where(): this { return this; }
    andWhere(): this { return this; }
    leftJoin(): this { return this; }

    getRawOne<T>(): Promise<T> {
        const result = this.results[this.callIndex++];
        return Promise.resolve(result as T);
    }
}

interface DashboardServicePrivate {
    getBalanceDeltaSinceDate(checkedOnly: boolean, fromDate: Date, accountId: number): Promise<QueryResult>;
}

describe("DashboardService.getBalanceDeltaSinceDate", () => {
    let qb: MockBalanceDeltaQueryBuilder;
    let createQueryBuilder: ReturnType<typeof vi.fn>;
    let service: DashboardService;

    beforeEach(() => {
        qb = new MockBalanceDeltaQueryBuilder();
        createQueryBuilder = vi.fn(() => qb);

        const accountLineRepo = {
            createQueryBuilder
        };

        service = new DashboardService(
            accountLineRepo as never,
            {} as never,
            {} as never,
            {} as never
        );
    });

    it("builds query with fromDate, hors-compte exclusion and checked filter", async () => {
        const fromDate = new Date("2026-01-15T00:00:00.000Z");
        qb.rawResult = { value: "42.5" };

        const result = await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(true, fromDate, 3);

        expect(createQueryBuilder).toHaveBeenCalledWith("al");
        expect(qb.selectCalls).toEqual([
            {
                sql: "COALESCE(SUM(al.credit - al.debit), 0)",
                alias: "value"
            }
        ]);
        expect(qb.whereCalls).toEqual([
            {
                sql: "al.account_id = :accountId",
                params: { accountId: 3 }
            }
        ]);
        expect(qb.leftJoinCalls).toEqual([{ relation: "al.nature", alias: "nature" }]);
        expect(qb.andWhereCalls).toEqual([
            {
                sql: "al.dateOperation >= :fromDate",
                params: { fromDate }
            },
            {
                sql: "(nature.id IS NULL OR nature.isHorsCompte = false)",
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

        const result = await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(false, fromDate, 7);

        expect(qb.whereCalls).toEqual([
            {
                sql: "al.account_id = :accountId",
                params: { accountId: 7 }
            }
        ]);
        expect(qb.andWhereCalls).toEqual([
            {
                sql: "al.dateOperation >= :fromDate",
                params: { fromDate }
            },
            {
                sql: "(nature.id IS NULL OR nature.isHorsCompte = false)",
                params: undefined
            }
        ]);
        expect(qb.getRawOneCalls).toBe(1);
        expect(result).toEqual({ value: 0 });
    });
});

describe("DashboardService.getOverview", () => {
    function buildService(options: {
        baseline: { amount: number | string; effectiveDate: Date } | null;
        deltaResults: QueryResult[];
        budgetItems: Array<{ amount: number | string | null; isActive: boolean }>;
        toCheckCounts: { inAccount: string | number | null; horsCompte: string | number | null };
        assignedKanbanTasksCount?: number;
    }): DashboardService {
        // Each createQueryBuilder call returns a fresh MockOverviewQueryBuilder
        // Calls order: currentDelta, forecastDelta, monthExpenses, toCheckCounts
        let qbCallIndex = 0;
        const createQueryBuilder = vi.fn(() => {
            const result = options.deltaResults[qbCallIndex++];
            return new MockOverviewQueryBuilder([result]);
        });

        const accountLineRepo = { createQueryBuilder };

        const budgetItemRepo = {
            find: vi.fn().mockResolvedValue(
                options.budgetItems
                    .filter(b => b.isActive)
                    .map((b, i) => ({ id: i + 1, amount: b.amount }))
            )
        };

        const accountRepo = {
            findOne: vi.fn().mockResolvedValue(
                options.baseline
                    ? { id: 1, baseLineAmount: options.baseline.amount, baseLineEffectiveDate: options.baseline.effectiveDate }
                    : null
            )
        };

        const kanbanTaskRepo = {
            createQueryBuilder: vi.fn(() => ({
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                getCount: vi.fn().mockResolvedValue(options.assignedKanbanTasksCount ?? 0),
            })),
        };

        return new DashboardService(
            accountLineRepo as never,
            budgetItemRepo as never,
            {} as never,
            accountRepo as never,
            kanbanTaskRepo as never,
        );
    }

    it("computes currentBalance = baseline + checked delta", async () => {
        const service = buildService({
            baseline: { amount: 1000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "250.50" },   // currentDelta (checked)
                { value: "400.75" },   // forecastDelta (all)
                { value: "120" },      // monthExpenses
                { inAccount: 3, horsCompte: 1 } as never // toCheckCounts
            ],
            budgetItems: [{ amount: 500, isActive: true }],
            toCheckCounts: { inAccount: 3, horsCompte: 1 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(1250.50);
    });

    it("computes forecastBalance = baseline + all operations delta", async () => {
        const service = buildService({
            baseline: { amount: 1000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "250.50" },
                { value: "400.75" },
                { value: "120" },
                { inAccount: 3, horsCompte: 1 } as never
            ],
            budgetItems: [{ amount: 500, isActive: true }],
            toCheckCounts: { inAccount: 3, horsCompte: 1 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.forecastBalance).toBeCloseTo(1400.75);
    });

    it("forecastBalance >= currentBalance when unchecked ops have positive net", async () => {
        const service = buildService({
            baseline: { amount: 500, effectiveDate: new Date("2025-06-01") },
            deltaResults: [
                { value: "100" },    // checked only
                { value: "300" },    // all (includes unchecked)
                { value: "0" },
                { inAccount: 0, horsCompte: 0 } as never
            ],
            budgetItems: [],
            toCheckCounts: { inAccount: 0, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.forecastBalance).toBeGreaterThanOrEqual(result.currentBalance);
        expect(result.currentBalance).toBeCloseTo(600);
        expect(result.forecastBalance).toBeCloseTo(800);
    });

    it("uses fallback baseline (amount=0, date=1960) when no baseline exists", async () => {
        const service = buildService({
            baseline: null,
            deltaResults: [
                { value: "500" },
                { value: "750" },
                { value: "80" },
                { inAccount: 2, horsCompte: 0 } as never
            ],
            budgetItems: [{ amount: 200, isActive: true }],
            toCheckCounts: { inAccount: 2, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        // 0 + delta (no baseline amount)
        expect(result.currentBalance).toBeCloseTo(500);
        expect(result.forecastBalance).toBeCloseTo(750);
    });

    it("handles string amounts from PostgreSQL decimals", async () => {
        const service = buildService({
            baseline: { amount: "2500.99" as unknown as number, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "-150.33" },
                { value: "-50.10" },
                { value: "200.50" },
                { inAccount: "5", horsCompte: "2" } as never
            ],
            budgetItems: [
                { amount: "300.50" as unknown as number, isActive: true },
                { amount: "150.25" as unknown as number, isActive: true }
            ],
            toCheckCounts: { inAccount: "5", horsCompte: "2" }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(2350.66);
        expect(result.forecastBalance).toBeCloseTo(2450.89);
        expect(result.monthExpenses).toBeCloseTo(200.50);
        expect(result.monthlyBudget).toBeCloseTo(450.75);
        expect(result.operationsToCheckInAccountCount).toBe(5);
        expect(result.operationsToCheckHorsCompteCount).toBe(2);
    });

    it("sums monthlyBudget from all active budget items", async () => {
        const service = buildService({
            baseline: { amount: 0, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "0" },
                { value: "0" },
                { value: "0" },
                { inAccount: 0, horsCompte: 0 } as never
            ],
            budgetItems: [
                { amount: 100, isActive: true },
                { amount: 250, isActive: true },
                { amount: 999, isActive: false }, // inactive: should not count
                { amount: 75.50, isActive: true }
            ],
            toCheckCounts: { inAccount: 0, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.monthlyBudget).toBeCloseTo(425.50);
    });

    it("handles null/undefined delta values gracefully", async () => {
        const service = buildService({
            baseline: { amount: 1000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                undefined,     // currentDelta returns undefined
                { value: 0 },  // forecastDelta
                undefined,     // monthExpenses returns undefined
                { inAccount: null, horsCompte: null } as never
            ],
            budgetItems: [],
            toCheckCounts: { inAccount: null, horsCompte: null }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBe(1000);
        expect(result.forecastBalance).toBe(1000);
        expect(result.monthExpenses).toBe(0);
        expect(result.operationsToCheckInAccountCount).toBe(0);
        expect(result.operationsToCheckHorsCompteCount).toBe(0);
    });

    it("handles negative deltas (more debits than credits)", async () => {
        const service = buildService({
            baseline: { amount: 5000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "-1200.00" },
                { value: "-1800.00" },
                { value: "1200" },
                { inAccount: 10, horsCompte: 3 } as never
            ],
            budgetItems: [{ amount: 800, isActive: true }],
            toCheckCounts: { inAccount: 10, horsCompte: 3 }
        });

        const result: DashboardOverview = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(3800);
        expect(result.forecastBalance).toBeCloseTo(3200);
        expect(result.monthExpenses).toBeCloseTo(1200);
        expect(result.monthlyBudget).toBeCloseTo(800);
        expect(result.operationsToCheckInAccountCount).toBe(10);
        expect(result.operationsToCheckHorsCompteCount).toBe(3);
    });

    it("handles budget items with null amounts", async () => {
        const service = buildService({
            baseline: { amount: 0, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "0" },
                { value: "0" },
                { value: "0" },
                { inAccount: 0, horsCompte: 0 } as never
            ],
            budgetItems: [
                { amount: null, isActive: true },
                { amount: 200, isActive: true }
            ],
            toCheckCounts: { inAccount: 0, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.monthlyBudget).toBeCloseTo(200);
    });
});
