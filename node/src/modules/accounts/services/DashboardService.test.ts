import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardService, { BudgetVsActualByPoste, DashboardOverview } from "./DashboardService";

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
    getBalanceDeltaSinceDate(checkedOnly: boolean, fromDate: Date, toDate: Date | undefined, accountId: number): Promise<QueryResult>;
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

        const result = await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(true, fromDate, undefined, 3);

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

        const result = await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(false, fromDate, undefined, 7);

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

    it("adds toDate filter when toDate is provided", async () => {
        const fromDate = new Date("2026-02-01T00:00:00.000Z");
        const toDate = new Date("2026-03-01T00:00:00.000Z");
        qb.rawResult = { value: 123 };

        await (service as unknown as DashboardServicePrivate).getBalanceDeltaSinceDate(false, fromDate, toDate, 5);

        expect(qb.andWhereCalls).toContainEqual({
            sql: "al.dateOperation < :toDate",
            params: { toDate }
        });
    });
});

describe("DashboardService.getOverview", () => {
    function buildService(options: {
        baseline: { amount: number | string; effectiveDate: Date } | null;
        deltaResults: QueryResult[];
        budgetVsActual?: BudgetVsActualByPoste[];
        toCheckCounts: { inAccount: string | number | null; horsCompte: string | number | null };
        assignedKanbanTasksCount?: number;
    }): DashboardService {
        let deltaCallIndex = 0;
        const accountLineRepo = {
            createQueryBuilder: vi.fn().mockImplementation((alias: string) => {
                if (alias === 'al') { // Target getBalanceDeltaSinceDate and getOperationsToCheckCounts
                    return {
                        select: vi.fn().mockReturnThis(),
                        addSelect: vi.fn().mockReturnThis(),
                        where: vi.fn().mockReturnThis(),
                        andWhere: vi.fn().mockReturnThis(),
                        leftJoin: vi.fn().mockReturnThis(),
                        groupBy: vi.fn().mockReturnThis(),
                        addGroupBy: vi.fn().mockReturnThis(),
                        getRawOne: vi.fn().mockImplementation(() => {
                            if (deltaCallIndex < options.deltaResults.length) {
                                return Promise.resolve(options.deltaResults[deltaCallIndex++]);
                            }
                            return Promise.resolve(options.toCheckCounts);
                        }),
                    };
                }
                return {
                    // Default mock for other createQueryBuilder calls if any
                    select: vi.fn().mockReturnThis(),
                    addSelect: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    leftJoin: vi.fn().mockReturnThis(),
                    groupBy: vi.fn().mockReturnThis(),
                    addGroupBy: vi.fn().mockReturnThis(),
                    getRawOne: vi.fn().mockResolvedValue({}),
                    getRawMany: vi.fn().mockResolvedValue([]),
                };
            })
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

        const service = new DashboardService(
            accountLineRepo as never,
            {} as never,
            {} as never,
            accountRepo as never,
            kanbanTaskRepo as never,
        );

        vi.spyOn(service, 'getBudgetVsActual').mockResolvedValue(options.budgetVsActual ?? []);
        vi.spyOn(service, 'getOperationsToCheckCounts').mockResolvedValue({ inAccount: Number(options.toCheckCounts.inAccount ?? 0), horsCompte: Number(options.toCheckCounts.horsCompte ?? 0) });

        return service;
    }

    it("computes currentBalance = baseline + checked delta", async () => {
        const service = buildService({
            baseline: { amount: 1000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "250.50" },   // currentDelta (checked)
                { value: "300.00" },   // forecast month end
                { value: "400.75" },   // forecast 3 months
                { value: "500.00" },   // forecast final
            ],
            budgetVsActual: [{ posteId: 1, posteLabel: "A", posteColor: "#000", budgetAmount: 500, actualAmount: 120 }],
            toCheckCounts: { inAccount: 3, horsCompte: 1 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(1250.50);
    });

    it("computes forecast balances = baseline + all operations delta up to different dates", async () => {
        const service = buildService({
            baseline: { amount: 1000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "250.50" },
                { value: "300.00" },
                { value: "400.75" },
                { value: "500.00" },
            ],
            budgetVsActual: [{ posteId: 1, posteLabel: "A", posteColor: "#000", budgetAmount: 500, actualAmount: 120 }],
            toCheckCounts: { inAccount: 3, horsCompte: 1 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.forecastBalanceMonthEnd).toBeCloseTo(1300.00);
        expect(result.forecastBalanceThreeMonths).toBeCloseTo(1400.75);
        expect(result.forecastBalanceFinal).toBeCloseTo(1500.00);
    });

    it("forecastBalances >= currentBalance when unchecked ops have positive net", async () => {
        const service = buildService({
            baseline: { amount: 500, effectiveDate: new Date("2025-06-01") },
            deltaResults: [
                { value: "100" },    // checked only
                { value: "200" },    // month end
                { value: "300" },    // 3 months
                { value: "400" },    // final
            ],
            toCheckCounts: { inAccount: 0, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(600);
        expect(result.forecastBalanceMonthEnd).toBeCloseTo(700);
        expect(result.forecastBalanceThreeMonths).toBeCloseTo(800);
        expect(result.forecastBalanceFinal).toBeCloseTo(900);
        expect(result.forecastBalanceMonthEnd).toBeGreaterThanOrEqual(result.currentBalance);
        expect(result.forecastBalanceThreeMonths).toBeGreaterThanOrEqual(result.forecastBalanceMonthEnd);
        expect(result.forecastBalanceFinal).toBeGreaterThanOrEqual(result.forecastBalanceThreeMonths);
    });

    it("uses fallback baseline (amount=0, date=1960) when no baseline exists", async () => {
        const service = buildService({
            baseline: null,
            deltaResults: [
                { value: "500" },
                { value: "650" },
                { value: "750" },
                { value: "850" },
            ],
            budgetVsActual: [{ posteId: 1, posteLabel: "A", posteColor: "#000", budgetAmount: 200, actualAmount: 80 }],
            toCheckCounts: { inAccount: 2, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        // 0 + delta (no baseline amount)
        expect(result.currentBalance).toBeCloseTo(500);
        expect(result.forecastBalanceMonthEnd).toBeCloseTo(650);
        expect(result.forecastBalanceThreeMonths).toBeCloseTo(750);
        expect(result.forecastBalanceFinal).toBeCloseTo(850);
    });

    it("handles string amounts from PostgreSQL decimals", async () => {
        const service = buildService({
            baseline: { amount: "2500.99" as unknown as number, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "-150.33" },
                { value: "-100.00" },
                { value: "-50.10" },
                { value: "0.00" },
            ],
            budgetVsActual: [
                { posteId: 1, posteLabel: "A", posteColor: "#000", budgetAmount: 300.50, actualAmount: 120.25 },
                { posteId: 2, posteLabel: "B", posteColor: "#111", budgetAmount: 150.25, actualAmount: 80.25 },
            ],
            toCheckCounts: { inAccount: "5", horsCompte: "2" }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(2350.66);
        expect(result.forecastBalanceMonthEnd).toBeCloseTo(2400.99);
        expect(result.forecastBalanceThreeMonths).toBeCloseTo(2450.89);
        expect(result.forecastBalanceFinal).toBeCloseTo(2500.99);
        expect(result.monthExpenses).toBeCloseTo(200.50);
        expect(result.monthlyBudget).toBeCloseTo(450.75);
        expect(result.operationsToCheckInAccountCount).toBe(5);
        expect(result.operationsToCheckHorsCompteCount).toBe(2);
    });

    it("derives monthlyBudget and monthExpenses from budget-vs-actual data", async () => {
        const service = buildService({
            baseline: { amount: 0, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "0" },
                { value: "0" },
                { value: "0" },
                { value: "0" },
            ],
            budgetVsActual: [
                { posteId: 1, posteLabel: "A", posteColor: "#000", budgetAmount: 100, actualAmount: 30 },
                { posteId: 2, posteLabel: "B", posteColor: "#111", budgetAmount: 250, actualAmount: 50 },
                { posteId: 3, posteLabel: "C", posteColor: "#222", budgetAmount: 75.50, actualAmount: 10 },
            ],
            toCheckCounts: { inAccount: 0, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.monthlyBudget).toBeCloseTo(425.50);
        expect(result.monthExpenses).toBeCloseTo(90);
    });

    it("handles null/undefined delta values gracefully", async () => {
        const service = buildService({
            baseline: { amount: 1000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                undefined,     // currentDelta returns undefined
                { value: 0 },  // forecastDelta month end
                undefined, // forecast 3 months
                { value: 50 }
            ],
            toCheckCounts: { inAccount: null, horsCompte: null }
        });

        const result = await service.getOverview(1, 1);

        expect(result.currentBalance).toBe(1000);
        expect(result.forecastBalanceMonthEnd).toBe(1000);
        expect(result.forecastBalanceThreeMonths).toBe(1000);
        expect(result.forecastBalanceFinal).toBe(1050);
        expect(result.monthExpenses).toBe(0);
        expect(result.operationsToCheckInAccountCount).toBe(0);
        expect(result.operationsToCheckHorsCompteCount).toBe(0);
    });

    it("handles negative deltas (more debits than credits)", async () => {
        const service = buildService({
            baseline: { amount: 5000, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "-1200.00" },
                { value: "-1500.00" },
                { value: "-1800.00" },
                { value: "-2000.00" },
            ],
            budgetVsActual: [
                { posteId: 1, posteLabel: "A", posteColor: "#000", budgetAmount: 800, actualAmount: 1200 },
            ],
            toCheckCounts: { inAccount: 10, horsCompte: 3 }
        });

        const result: DashboardOverview = await service.getOverview(1, 1);

        expect(result.currentBalance).toBeCloseTo(3800);
        expect(result.forecastBalanceMonthEnd).toBeCloseTo(3500);
        expect(result.forecastBalanceThreeMonths).toBeCloseTo(3200);
        expect(result.forecastBalanceFinal).toBeCloseTo(3000);
        expect(result.monthExpenses).toBeCloseTo(1200);
        expect(result.monthlyBudget).toBeCloseTo(800);
        expect(result.operationsToCheckInAccountCount).toBe(10);
        expect(result.operationsToCheckHorsCompteCount).toBe(3);
    });

    it("returns zero budget when no postes have budget or expenses", async () => {
        const service = buildService({
            baseline: { amount: 0, effectiveDate: new Date("2025-01-01") },
            deltaResults: [
                { value: "0" },
                { value: "0" },
                { value: "0" },
                { value: "0" },
            ],
            budgetVsActual: [],
            toCheckCounts: { inAccount: 0, horsCompte: 0 }
        });

        const result = await service.getOverview(1, 1);

        expect(result.monthlyBudget).toBe(0);
        expect(result.monthExpenses).toBe(0);
    });
});
