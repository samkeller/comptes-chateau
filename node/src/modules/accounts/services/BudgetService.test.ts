import { describe, expect, it } from "vitest";
import { TEST_ACCOUNT_ID, fixtures, testDataSource } from "../../../tests/testDbSetup";
import { RecurringExpenseFrequency } from "../entities/RecurringExpense";
import BudgetService from "./BudgetService";

describe("BudgetService", () => {
    it("returns signed unified budget lines with explicit debit and credit amounts", async () => {
        const accountId = TEST_ACCOUNT_ID;
        const poste = await fixtures.postes.create({ accountId, label: "Logement" });

        await fixtures.budgetItems.create({ accountId, posteId: poste.id, label: "Budget courses", amount: -240, sortOrder: 1 });
        await fixtures.budgetItems.create({ accountId, posteId: poste.id, label: "Budget prime", amount: 120, sortOrder: 2 });
        await fixtures.recurringExpenses.create({
            accountId, posteId: poste.id, label: "Loyer", solde: -900,
            nextOccurrence: new Date("2026-10-01"), frequency: RecurringExpenseFrequency.MONTHLY,
        });
        await fixtures.recurringExpenses.create({
            accountId, posteId: poste.id, label: "Prime annuelle", solde: 1200,
            nextOccurrence: new Date("2026-12-01"), frequency: RecurringExpenseFrequency.YEARLY,
        });

        const lines = await new BudgetService(testDataSource.manager).getUnifiedBudgetByPoste(TEST_ACCOUNT_ID);

        expect(lines).toEqual(expect.arrayContaining([
            expect.objectContaining({
                source: "budget",
                label: "Budget courses",
                amount: -240,
                debit: 240,
                credit: 0,
            }),
            expect.objectContaining({
                source: "budget",
                label: "Budget prime",
                amount: 120,
                debit: 0,
                credit: 120,
            }),
            expect.objectContaining({
                source: "recurring",
                label: "Loyer",
                amount: -900,
                debit: 900,
                credit: 0,
            }),
            expect.objectContaining({
                source: "recurring",
                label: "Prime annuelle",
                amount: 100,
                debit: 0,
                credit: 100,
            }),
        ]));
    });
});