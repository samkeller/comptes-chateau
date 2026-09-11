import { beforeEach, describe, expect, it } from "vitest";
import DashboardService from "./DashboardService";
import { testDataSource, TEST_ACCOUNT_ID, TEST_USER_ID } from "../../../tests/testDbSetup";
import { Account } from "../entities/Account";
import { AccountLine, AccountLineSource } from "../entities/AccountLine";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";
import { RecurringExpense, RecurringExpenseFrequency } from "../entities/RecurringExpense";

describe("DashboardService.getOverview", () => {
    let service: DashboardService;
    let poste: AccountLinePoste;

    beforeEach(async () => {
        service = new DashboardService(testDataSource.manager);

        const account = await testDataSource.getRepository(Account).findOne({ where: { id: TEST_ACCOUNT_ID } });
        expect(account).not.toBeNull();
        account!.baseLineAmount = 1000;
        account!.baseLineEffectiveDate = new Date("2025-01-01T00:00:00.000Z");
        await testDataSource.getRepository(Account).save(account!);

        poste = await testDataSource.getRepository(AccountLinePoste).save({
            accountId: TEST_ACCOUNT_ID,
            label: "Logement",
            color: "#1a73e8",
        });
    });

    it("computes currentBalance from the checked operations and baseline", async () => {
        await testDataSource.getRepository(AccountLine).save([
            {
                accountId: TEST_ACCOUNT_ID,
                posteId: poste.id,
                label: "Salaire",
                debit: 0,
                credit: 450,
                isChecked: true,
                source: AccountLineSource.MANUAL,
                dateOperation: new Date("2025-02-10T00:00:00.000Z"),
                dateValeur: new Date("2025-02-11T00:00:00.000Z"),
            },
            {
                accountId: TEST_ACCOUNT_ID,
                posteId: poste.id,
                label: "Courses",
                debit: 80,
                credit: 0,
                isChecked: true,
                source: AccountLineSource.MANUAL,
                dateOperation: new Date("2025-02-15T00:00:00.000Z"),
                dateValeur: new Date("2025-02-16T00:00:00.000Z"),
            },
            {
                accountId: TEST_ACCOUNT_ID,
                posteId: poste.id,
                label: "Non vérifié",
                debit: 0,
                credit: 999,
                isChecked: false,
                source: AccountLineSource.MANUAL,
                dateOperation: new Date("2025-02-18T00:00:00.000Z"),
                dateValeur: null,
            },
        ]);

        const overview = await service.getOverview(TEST_USER_ID, TEST_ACCOUNT_ID);

        expect(overview.currentBalance).toBeCloseTo(1370);
    });

    it("includes future recurring expenses in the forecast balance", async () => {
        await testDataSource.getRepository(RecurringExpense).save({
            accountId: TEST_ACCOUNT_ID,
            posteId: poste.id,
            label: "Loyer",
            solde: -300,
            isActive: true,
            frequency: RecurringExpenseFrequency.MONTHLY,
            nextOccurrence: new Date(),
            natureId: null,
        });

        const overview = await service.getOverview(TEST_USER_ID, TEST_ACCOUNT_ID);

        expect(overview.forecastBalanceMonthEnd).toBeLessThan(overview.currentBalance);
    });

    it("aggregates budget items and recurring expenses into the monthly budget", async () => {
        await testDataSource.getRepository(BudgetItem).save([
            {
                account: { id: TEST_ACCOUNT_ID } as Account,
                poste: poste,
                label: "Budget loyer",
                amount: 500,
                isActive: true,
                sortOrder: 1,
            },
            {
                account: { id: TEST_ACCOUNT_ID } as Account,
                poste: poste,
                label: "Budget alimentation",
                amount: 150,
                isActive: true,
                sortOrder: 2,
            }
        ]);

        await testDataSource.getRepository(RecurringExpense).save({
            accountId: TEST_ACCOUNT_ID,
            posteId: poste.id,
            label: "Abonnement",
            solde: -120,
            isActive: true,
            frequency: RecurringExpenseFrequency.MONTHLY,
            nextOccurrence: new Date(),
            natureId: null,
        });

        const overview = await service.getOverview(TEST_USER_ID, TEST_ACCOUNT_ID);

        expect(overview.monthlyBudget).toBeCloseTo(770);
    });
});
