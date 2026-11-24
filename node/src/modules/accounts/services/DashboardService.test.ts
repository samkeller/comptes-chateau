import { beforeEach, describe, expect, it } from "vitest";
import DashboardService from "./DashboardService";
import { fixtures, testDataSource, TEST_ACCOUNT_ID } from "../../../tests/testDbSetup";
import { Account } from "../entities/Account";
import { AccountLinePoste } from "../entities/AccountLinePoste";

describe("DashboardService.getOverview", () => {
    let service: DashboardService;
    let poste: AccountLinePoste;
    const accountId = TEST_ACCOUNT_ID;

    beforeEach(async () => {
        service = new DashboardService(testDataSource.manager);
        await testDataSource.getRepository(Account).update(accountId, {
            baseLineAmount: 1000,
            baseLineEffectiveDate: new Date("2025-01-01T00:00:00.000Z"),
        });
        poste = await fixtures.postes.create({ accountId, label: "Logement" });
    });

    it("computes currentBalance from the checked operations and baseline", async () => {
        await fixtures.accountLines.create({
            accountId, posteId: poste.id, label: "Salaire", credit: 450, isChecked: true,
            dateOperation: new Date("2025-02-10T00:00:00.000Z"), dateValeur: new Date("2025-02-11T00:00:00.000Z"),
        });
        await fixtures.accountLines.create({
            accountId, posteId: poste.id, label: "Courses", debit: 80, isChecked: true,
            dateOperation: new Date("2025-02-15T00:00:00.000Z"), dateValeur: new Date("2025-02-16T00:00:00.000Z"),
        });
        await fixtures.accountLines.create({
            accountId, posteId: poste.id, label: "Non vérifié", credit: 999,
            dateOperation: new Date("2025-02-18T00:00:00.000Z"),
        });

        const overview = await service.getOverview(accountId);

        expect(overview.currentBalance).toBeCloseTo(1370);
    });

    it("includes future recurring expenses in the forecast balance", async () => {
        await fixtures.recurringExpenses.create({ accountId, posteId: poste.id, label: "Loyer", solde: -300, nextOccurrence: new Date() });

        const overview = await service.getOverview(accountId);

        expect(overview.forecastBalanceMonthEnd).toBeLessThan(overview.currentBalance);
    });

    it("aggregates budget items and recurring expenses into the monthly budget", async () => {
        await fixtures.budgetItems.create({ account: { id: accountId }, poste: { id: poste.id }, label: "Budget loyer", amount: 500, sortOrder: 1 });
        await fixtures.budgetItems.create({ account: { id: accountId }, poste: { id: poste.id }, label: "Budget alimentation", amount: 150, sortOrder: 2 });
        await fixtures.recurringExpenses.create({ accountId, posteId: poste.id, label: "Abonnement", solde: -120, nextOccurrence: new Date() });

        const overview = await service.getOverview(accountId);

        expect(overview.monthlyBudget).toBeCloseTo(770);
    });
});
