import { describe, expect, it } from "vitest";
import type { UnifiedBudgetLine } from "@chocosous/shared";
import { buildBudgetOverviewData, getBudgetLineWeight } from "./BudgetOverviewCalculations";

function budgetLine(line: Partial<UnifiedBudgetLine> & Pick<UnifiedBudgetLine, "id" | "label" | "amount" | "debit" | "credit">): UnifiedBudgetLine {
    return {
        source: "budget",
        posteId: null,
        posteLabel: null,
        posteColor: null,
        ...line,
    };
}

describe("BudgetOverviewCalculations", () => {
    it("computes budget percentages from debit and credit volume instead of signed net total", () => {
        const lines = [
            budgetLine({
                id: "recurring_1",
                source: "recurring",
                label: "Loyer",
                amount: -900,
                debit: 900,
                credit: 0,
                posteId: 1,
                posteLabel: "Logement",
                posteColor: "#445566",
            }),
            budgetLine({
                id: "budget_1",
                label: "Prime",
                amount: 1200,
                debit: 0,
                credit: 1200,
                posteId: 1,
                posteLabel: "Logement",
                posteColor: "#445566",
            }),
            budgetLine({
                id: "budget_2",
                label: "Courses",
                amount: -300,
                debit: 300,
                credit: 0,
                posteId: 2,
                posteLabel: "Alimentation",
                posteColor: "#112233",
            }),
        ];

        const { groupedData, totals } = buildBudgetOverviewData(lines);
        const alimentation = groupedData.find((group) => group.posteLabel === "Alimentation");
        const logement = groupedData.find((group) => group.posteLabel === "Logement");

        expect(totals).toEqual({
            netTotal: 0,
            creditTotal: 1200,
            debitTotal: 1200,
            volumeTotal: 2400,
        });
        expect(alimentation).toMatchObject({
            flowSharePercentage: 12.5,
            creditSharePercentage: 0,
            debitSharePercentage: 25,
        });
        expect(logement).toMatchObject({
            flowSharePercentage: 87.5,
            creditSharePercentage: 100,
            debitSharePercentage: 75,
        });
    });

    it("computes row weight from debit and credit volume", () => {
        const line = budgetLine({
            id: "recurring_1",
            source: "recurring",
            label: "Loyer",
            amount: -900,
            debit: 900,
            credit: 0,
        });
        const { groupedData } = buildBudgetOverviewData([
            line,
            budgetLine({
                id: "budget_1",
                label: "Prime",
                amount: 300,
                debit: 0,
                credit: 300,
            }),
        ]);

        expect(getBudgetLineWeight(line, groupedData[0]!)).toBe(75);
    });
});