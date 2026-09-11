import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecurringExpenseService from "./RecurringExpenseService";
import { RecurringExpense, RecurringExpenseFrequency } from "../entities/RecurringExpense";
import { testDataSource } from "../../../tests/testDbSetup";

const { getRepositoryMock } = vi.hoisted(() => ({
    getRepositoryMock: vi.fn()
}));

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: getRepositoryMock,
        manager: {
            getRepository: getRepositoryMock
        }
    }
}));

describe("RecurringExpenseService.save", () => {
    const recurringExpenseRepo = {
        save: vi.fn(async (payload: Partial<RecurringExpense>) => ({
            id: payload.id ?? 1,
            ...payload
        }))
    };

    const userRepo = {
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => ({ id: where.id, totalXp: 0 })),
        increment: vi.fn(async () => ({ raw: [], affected: 1 }))
    };

    beforeEach(() => {
        vi.clearAllMocks();

        getRepositoryMock.mockImplementation((entity: { name: string }) => {
            if (entity.name === "RecurringExpense") return recurringExpenseRepo;
            if (entity.name === "User") return userRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        });
    });

    it("awards XP when creating a recurring expense", async () => {
        const service = new RecurringExpenseService();

        await service.save({
            label: "Abonnement salle",
            solde: 29.99,
            isActive: true,
            nextOccurrence: "2026-04-01",
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null
        }, 1, 99);

        expect(userRepo.increment).toHaveBeenCalledWith({ id: 99 }, "totalXp", 100);
    });

    it("does not award XP when updating a recurring expense", async () => {
        const service = new RecurringExpenseService();

        await service.save({
            id: 4,
            label: "Abonnement salle",
            solde: 31.99,
            isActive: true,
            nextOccurrence: "2026-05-01",
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null
        }, 1, 99);

        expect(userRepo.increment).not.toHaveBeenCalled();
    });

    it("counts occurrences from the next scheduled date until the forecast horizon", async () => {
        const service = new RecurringExpenseService(testDataSource.manager);
        const now = new Date();

        const firstOccurrence = new Date(now);
        firstOccurrence.setDate(now.getDate() + 7);

        const secondOccurrence = new Date(now);
        secondOccurrence.setDate(now.getDate() + 25);

        const horizon = new Date(now);
        horizon.setDate(now.getDate() + 50);

        await testDataSource.getRepository(RecurringExpense).save([
            {
                id: 1,
                label: "Loyer",
                solde: -100,
                isActive: true,
                nextOccurrence: firstOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: 1,
            },
            {
                id: 2,
                label: "Abonnement",
                solde: -50,
                isActive: true,
                nextOccurrence: secondOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: 1,
            }
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(1, horizon);

        expect(total).toBe(250);
    });

    it("treats positive recurring income as a negative cash impact on the balance forecast", async () => {
        const service = new RecurringExpenseService(testDataSource.manager);
        const now = new Date();

        const expenseOccurrence = new Date(now);
        expenseOccurrence.setDate(now.getDate() + 5);

        const incomeOccurrence = new Date(now);
        incomeOccurrence.setDate(now.getDate() + 15);

        const horizon = new Date(now);
        horizon.setDate(now.getDate() + 45);

        await testDataSource.getRepository(RecurringExpense).save([
            {
                id: 3,
                label: "Loyer",
                solde: -100,
                isActive: true,
                nextOccurrence: expenseOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: 1,
            },
            {
                id: 4,
                label: "Remboursement",
                solde: 30,
                isActive: true,
                nextOccurrence: incomeOccurrence,
                frequency: RecurringExpenseFrequency.MONTHLY,
                accountId: 1,
            }
        ] as RecurringExpense[]);

        const total = await service.simulateFutureRecurrent(1, horizon);

        expect(total).toBe(140);
    });
});
