import { describe, expect, it } from "vitest";
import { TEST_ACCOUNT_ID, testDataSource } from "../../../tests/testDbSetup";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";
import { RecurringExpense, RecurringExpenseFrequency } from "../entities/RecurringExpense";
import BudgetService from "./BudgetService";

describe("BudgetService", () => {
    it("returns signed unified budget lines with explicit debit and credit amounts", async () => {
        const poste = await testDataSource.getRepository(AccountLinePoste).save({
            label: "Logement",
            color: "#445566",
            accountId: TEST_ACCOUNT_ID,
        });

        await testDataSource.getRepository(BudgetItem).save([
            {
                label: "Budget courses",
                amount: -240,
                sortOrder: 1,
                isActive: true,
                account: { id: TEST_ACCOUNT_ID },
                poste,
            },
            {
                label: "Budget prime",
                amount: 120,
                sortOrder: 2,
                isActive: true,
                account: { id: TEST_ACCOUNT_ID },
                poste,
            },
        ]);

        await testDataSource.getRepository(RecurringExpense).save([
            {
                label: "Loyer",
                solde: -900,
                isActive: true,
                nextOccurrence: new Date("2026-10-01"),
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
                poste,
            },
            {
                label: "Prime annuelle",
                solde: 1200,
                isActive: true,
                nextOccurrence: new Date("2026-12-01"),
                frequency: RecurringExpenseFrequency.YEARLY,
                accountId: TEST_ACCOUNT_ID,
                poste,
            },
        ]);

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