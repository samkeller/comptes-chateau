import { describe, expect, it } from "vitest";
import { accountNotifications, type AccountSituation } from "./accountNotifications";

const NOW = new Date("2026-11-23T10:00:00.000Z");

const healthyOverview: AccountSituation["overview"] = {
    currentBalance: 1200,
    forecastBalanceMonthEnd: 800,
    monthExpenses: 300,
    monthlyBudget: 1000,
    operationsToCheckInAccountCount: 0,
    operationsToCheckHorsCompteCount: 0,
};

describe("accountNotifications", () => {
    it("returns nothing when every account is fine", () => {
        expect(accountNotifications([{ id: 1, label: "Joint", overview: healthyOverview }], NOW)).toEqual([]);
    });

    it("raises a high severity notification when an account is in the red", () => {
        const result = accountNotifications([
            { id: 1, label: "Joint", overview: { ...healthyOverview, currentBalance: -42.5, forecastBalanceMonthEnd: -100 } },
        ], NOW);

        expect(result).toEqual([{
            key: "ACCOUNT_NEGATIVE:1:2026-11-23",
            type: "ACCOUNT_NEGATIVE",
            severity: "high",
            title: "Compte dans le rouge",
            message: expect.stringContaining("Joint"),
            occurredAt: NOW.toISOString(),
            target: { kind: "accountDashboard", accountId: 1 },
        }]);
    });

    it("warns when the end-of-month forecast of a positive account is negative", () => {
        const result = accountNotifications([
            { id: 2, label: "Perso", overview: { ...healthyOverview, currentBalance: 50, forecastBalanceMonthEnd: -20 } },
        ], NOW);

        expect(result).toEqual([expect.objectContaining({
            key: "ACCOUNT_GOING_NEGATIVE:2:2026-11-23",
            severity: "medium",
            target: { kind: "accountDashboard", accountId: 2 },
        })]);
    });

    it("warns when the monthly budget of an account is exceeded", () => {
        const result = accountNotifications([
            { id: 1, label: "Joint", overview: { ...healthyOverview, monthExpenses: 1000.01, monthlyBudget: 1000 } },
        ], NOW);

        expect(result).toEqual([expect.objectContaining({
            key: "ACCOUNT_BUDGET_EXCEEDED:1:2026-11-23",
            severity: "medium",
            target: { kind: "budgetOverview", accountId: 1 },
        })]);
    });

    it("ignores budget when the account has no budget, or when expenses only reach it", () => {
        const result = accountNotifications([
            { id: 1, label: "Sans budget", overview: { ...healthyOverview, monthExpenses: 50, monthlyBudget: 0 } },
            { id: 2, label: "Pile", overview: { ...healthyOverview, monthExpenses: 1000, monthlyBudget: 1000 } },
        ], NOW);

        expect(result).toEqual([]);
    });

    it("signals operations to check only beyond 5, counting off-account operations too", () => {
        const result = accountNotifications([
            { id: 1, label: "Joint", overview: { ...healthyOverview, operationsToCheckInAccountCount: 4, operationsToCheckHorsCompteCount: 2 } },
            { id: 2, label: "Perso", overview: { ...healthyOverview, operationsToCheckInAccountCount: 5, operationsToCheckHorsCompteCount: 0 } },
        ], NOW);

        expect(result).toEqual([expect.objectContaining({
            key: "OPERATIONS_TO_CHECK:1:2026-11-23",
            severity: "medium",
            title: "6 opérations à valider",
            message: expect.stringContaining("Joint"),
            target: { kind: "accountChecks", accountId: 1 },
        })]);
    });
});
