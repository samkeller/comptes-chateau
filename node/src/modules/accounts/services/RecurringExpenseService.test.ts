import { beforeEach, describe, expect, it } from "vitest";
import RecurringExpenseService from "./RecurringExpenseService";
import { RecurringExpense, RecurringExpenseFrequency } from "../entities/RecurringExpense";
import { TEST_ACCOUNT_ID, TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";

describe("RecurringExpenseService", () => {
    let service: RecurringExpenseService;

    beforeEach(async () => {
        service = new RecurringExpenseService(testDataSource.manager);
        const userRepo = testDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: TEST_USER_ID } });
        if (user) {
            user.totalXp = 0;
            await userRepo.save(user);
        }
    });

    it("awards XP when creating a recurring expense", async () => {
        await service.save({
            label: "Abonnement salle",
            solde: 29.99,
            isActive: true,
            nextOccurrence: "2026-04-01",
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null,
        }, TEST_ACCOUNT_ID, TEST_USER_ID);

        const user = await testDataSource.getRepository(User).findOne({ where: { id: TEST_USER_ID } });
        expect(user?.totalXp).toBe(100);
    });

    it("does not award XP when updating a recurring expense", async () => {
        await testDataSource.getRepository(RecurringExpense).save({
            id: 1,
            accountId: TEST_ACCOUNT_ID,
            label: "Abonnement salle",
            solde: 31.99,
            isActive: true,
            nextOccurrence: new Date("2026-05-01T00:00:00.000Z"),
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null,
        });

        await service.save({
            id: 1,
            label: "Abonnement salle",
            solde: 31.99,
            isActive: true,
            nextOccurrence: "2026-05-01",
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null,
        }, TEST_ACCOUNT_ID, TEST_USER_ID);

        const user = await testDataSource.getRepository(User).findOne({ where: { id: TEST_USER_ID } });
        expect(user?.totalXp).toBe(0);
    });

    it("counts occurrences from the next scheduled date until the forecast horizon", async () => {
        const now = new Date();

        const firstOccurrence = new Date(now);
        firstOccurrence.setDate(now.getDate() + 7);

        const secondOccurrence = new Date(now);
        secondOccurrence.setDate(now.getDate() + 25);

        const horizon = new Date(now);
        horizon.setDate(now.getDate() + 50);

        await testDataSource.getRepository(RecurringExpense).save([
            {
                label: "Loyer",
                solde: -100,
                isActive: true,
                nextOccurrence: firstOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
            {
                label: "Abonnement",
                solde: -50,
                isActive: true,
                nextOccurrence: secondOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            }
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(TEST_ACCOUNT_ID, horizon);

        expect(total).toBe(250);
    });

    it("treats positive recurring income as a negative cash impact on the balance forecast", async () => {
        const now = new Date();

        const expenseOccurrence = new Date(now);
        expenseOccurrence.setDate(now.getDate() + 5);

        const incomeOccurrence = new Date(now);
        incomeOccurrence.setDate(now.getDate() + 15);

        const horizon = new Date(now);
        horizon.setDate(now.getDate() + 45);

        await testDataSource.getRepository(RecurringExpense).save([
            {
                label: "Loyer",
                solde: -100,
                isActive: true,
                nextOccurrence: expenseOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
            {
                label: "Remboursement",
                solde: 30,
                isActive: true,
                nextOccurrence: incomeOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            }
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(TEST_ACCOUNT_ID, horizon);

        expect(total).toBe(140);
    });
});
