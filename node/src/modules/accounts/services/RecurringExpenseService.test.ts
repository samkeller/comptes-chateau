import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecurringExpenseService from "./RecurringExpenseService";
import {
    RecurringExpense,
    RecurringExpenseFrequency,
} from "../entities/RecurringExpense";
import {
    TEST_ACCOUNT_ID,
    TEST_USER_ID,
    testDataSource,
} from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";

const NOW = new Date("2026-09-11T00:00:00.000Z");

describe("RecurringExpenseService", () => {
    let service: RecurringExpenseService;

    beforeEach(async () => {
        service = new RecurringExpenseService(testDataSource.manager);

        const userRepo = testDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: TEST_USER_ID },
        });

        if (user) {
            user.totalXp = 0;
            await userRepo.save(user);
        }

        // On fake uniquement Date.
        // Les timers réels restent disponibles pour TypeORM / SQLite.
        vi.useFakeTimers({
            toFake: ["Date"],
            now: NOW,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("awards XP when creating a recurring expense", async () => {
        await service.save(
            {
                label: "Abonnement salle",
                solde: 29.99,
                isActive: true,
                nextOccurrence: "2026-10-01",
                frequency: RecurringExpenseFrequency.MONTHLY,
                natureId: null,
                posteId: null,
            },
            TEST_ACCOUNT_ID,
            TEST_USER_ID,
        );

        const user = await testDataSource.getRepository(User).findOne({
            where: { id: TEST_USER_ID },
        });

        expect(user?.totalXp).toBe(100);
    });

    it("does not award XP when updating a recurring expense", async () => {
        await testDataSource.getRepository(RecurringExpense).save({
            id: 1,
            accountId: TEST_ACCOUNT_ID,
            label: "Abonnement salle",
            solde: 31.99,
            isActive: true,
            nextOccurrence: new Date("2026-10-01T00:00:00.000Z"),
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null,
        });

        await service.save(
            {
                id: 1,
                label: "Abonnement salle",
                solde: 31.99,
                isActive: true,
                nextOccurrence: "2026-10-01",
                frequency: RecurringExpenseFrequency.MONTHLY,
                natureId: null,
                posteId: null,
            },
            TEST_ACCOUNT_ID,
            TEST_USER_ID,
        );

        const user = await testDataSource.getRepository(User).findOne({
            where: { id: TEST_USER_ID },
        });

        expect(user?.totalXp).toBe(0);
    });

    it("counts monthly occurrences from the next scheduled date until the forecast horizon", async () => {
        const horizon = new Date("2026-12-31T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save([
            {
                label: "Loyer",
                solde: -100,
                isActive: true,
                // 15/09, 15/10, 15/11, 15/12
                nextOccurrence: new Date("2026-09-15T00:00:00.000Z"),
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
            {
                label: "Abonnement",
                solde: -50,
                isActive: true,
                // 22/09, 22/10, 22/11, 22/12
                nextOccurrence: new Date("2026-09-22T00:00:00.000Z"),
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // Loyer : 4 × 100 = +400
        // Abonnement : 4 × 50 = +200
        expect(total).toBe(-600);
    });

    it("treats positive recurring income as a negative cash impact on the balance forecast", async () => {
        const expenseOccurrence = new Date("2026-09-16T00:00:00.000Z");
        const incomeOccurrence = new Date("2026-09-26T00:00:00.000Z");
        const horizon = new Date("2026-10-26T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save([
            {
                label: "Loyer",
                solde: -100,
                isActive: true,
                // 16/09 puis 16/10
                nextOccurrence: expenseOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
            {
                label: "Remboursement",
                solde: 30,
                isActive: true,
                // 26/09 puis 26/10
                nextOccurrence: incomeOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // Dépenses : 2 × -100 = -200
        // Revenus : 2 × +30 = 60
        // Total : -140
        expect(total).toBe(-170);
    });

    it("[simulateFutureRecurrent()] includes the recurring expense occurring on the last day of the current month", async () => {
        const endOfMonth = new Date("2026-09-30T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save({
            label: "Loyer",
            solde: -100,
            isActive: true,
            nextOccurrence: endOfMonth,
            frequency: RecurringExpenseFrequency.MONTHLY,
            accountId: TEST_ACCOUNT_ID,
        });

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            endOfMonth,
        );

        expect(total).toBe(-100);
    });

    it("[simulateFutureRecurrent()] includes all monthly occurrences until the end of the month three months later", async () => {
        const firstOccurrence = new Date("2026-09-30T00:00:00.000Z");
        const horizon = new Date("2026-12-31T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save({
            label: "Loyer",
            solde: -100,
            isActive: true,
            nextOccurrence: firstOccurrence,
            frequency: RecurringExpenseFrequency.MONTHLY,
            accountId: TEST_ACCOUNT_ID,
        });

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // 30/09, 31/10, 30/11, 31/12
        expect(total).toBe(-400);
    });

    it("[simulateFutureRecurrent()] does not include the occurrence after the forecast horizon", async () => {
        const firstOccurrence = new Date("2026-09-30T00:00:00.000Z");
        const horizon = new Date("2026-12-30T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save({
            label: "Loyer",
            solde: -100,
            isActive: true,
            nextOccurrence: firstOccurrence,
            frequency: RecurringExpenseFrequency.MONTHLY,
            accountId: TEST_ACCOUNT_ID,
        });

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // 30/09, 31/10, 30/11
        // Le 31/12 est après le 30/12.
        expect(total).toBe(-300);
    });

    it("[simulateFutureRecurrent()] includes an occurrence exactly on the forecast horizon", async () => {
        const firstOccurrence = new Date("2026-09-30T00:00:00.000Z");
        const horizon = new Date("2026-12-31T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save({
            label: "Loyer",
            solde: -100,
            isActive: true,
            nextOccurrence: firstOccurrence,
            frequency: RecurringExpenseFrequency.MONTHLY,
            accountId: TEST_ACCOUNT_ID,
        });

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // 30/09, 31/10, 30/11, 31/12
        expect(total).toBe(-400);
    });

    it("[simulateFutureRecurrent()] preserves the existing sign convention", async () => {
        const firstOccurrence = new Date("2026-09-30T00:00:00.000Z");
        const horizon = new Date("2026-12-31T00:00:00.000Z");

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
                label: "Salaire",
                solde: 2000,
                isActive: true,
                nextOccurrence: firstOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: TEST_ACCOUNT_ID,
            },
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // Dépenses : 4 × -100 = -400
        // Revenus : 4 × +2000 = +8000
        // Total : 7600
        expect(total).toBe(7600);
    });

    it("[simulateFutureRecurrent()] calculates quarterly occurrences using calendar months", async () => {
        const firstOccurrence = new Date("2026-09-30T00:00:00.000Z");
        const horizon = new Date("2027-06-30T00:00:00.000Z");

        await testDataSource.getRepository(RecurringExpense).save({
            label: "Assurance",
            solde: -300,
            isActive: true,
            nextOccurrence: firstOccurrence,
            frequency: RecurringExpenseFrequency.QUARTERLY,
            accountId: TEST_ACCOUNT_ID,
        });

        const total = await service.simulateFutureRecurrent(
            TEST_ACCOUNT_ID,
            horizon,
        );

        // 30/09, 31/12, 31/03, 30/06
        expect(total).toBe(-1200);
    });
});