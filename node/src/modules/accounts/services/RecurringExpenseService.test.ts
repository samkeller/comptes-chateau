import { beforeEach, describe, expect, it, vi } from "vitest";
import RecurringExpenseService from "./RecurringExpenseService";
import {
    RecurringExpense,
    RecurringExpenseFrequency,
} from "../entities/RecurringExpense";
import { User } from "../../core/entities/User";

const { managerMock } = vi.hoisted(() => ({
    managerMock: {
        getRepository: vi.fn(),
    },
}));

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        get manager() {
            return managerMock;
        },
    },
}));

describe("RecurringExpenseService.save", () => {
    const recurringExpenseRepo = {
        save: vi.fn(async (payload: Partial<RecurringExpense>) => ({
            id: payload.id ?? 1,
            ...payload,
        })),
    };

    const userRepo = {
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => ({
            id: where.id,
            totalXp: 0,
        })),

        increment: vi.fn(async () => ({
            raw: [],
            affected: 1,
        })),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        managerMock.getRepository.mockImplementation((entity) => {
            if (entity === RecurringExpense) {
                return recurringExpenseRepo;
            }

            if (entity === User) {
                return userRepo;
            }

            throw new Error(`Repository non mocké: ${entity.name}`);
        });
    });

    it("awards XP when creating a recurring expense", async () => {
        const service = new RecurringExpenseService();

        await service.save(
            {
                label: "Abonnement salle",
                solde: 29.99,
                isActive: true,
                nextOccurrence: "2026-04-01",
                frequency: RecurringExpenseFrequency.MONTHLY,
                natureId: null,
                posteId: null,
            },
            1,
            99
        );

        expect(userRepo.increment).toHaveBeenCalledWith(
            { id: 99 },
            "totalXp",
            100
        );
    });

    it("does not award XP when updating a recurring expense", async () => {
        const service = new RecurringExpenseService();

        await service.save(
            {
                id: 4,
                label: "Abonnement salle",
                solde: 31.99,
                isActive: true,
                nextOccurrence: "2026-05-01",
                frequency: RecurringExpenseFrequency.MONTHLY,
                natureId: null,
                posteId: null,
            },
            1,
            99
        );

        expect(userRepo.increment).not.toHaveBeenCalled();
    });
});