import { describe, expect, it, vi, beforeEach } from "vitest";
import UserXpService from "./UserXpService";
import { UserNotFoundError } from "./errors/UserNotFoundError";
import { UserXpActionsPoints } from "../utils/UserXPUtils";
import { xpEventBus } from "../events/XpEventBus";

function createService(user: { id: number; totalXp: number } | null) {
    const service = new UserXpService();

    const userRepo = {
        findOne: vi
            .fn()
            .mockResolvedValueOnce(user)
            .mockResolvedValueOnce(
                user
                    ? {
                          ...user,
                          totalXp:
                              user.totalXp +
                              UserXpActionsPoints.ACCOUNT_LINE_RULE_CREATED,
                      }
                    : null
            ),
        increment: vi.fn().mockResolvedValue(undefined),
    };

    (service as unknown as { userRepo: typeof userRepo }).userRepo = userRepo;

    return { service, userRepo };
}

describe("UserXpService.addXPForUser", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("adds XP to a user and emits an xp.updated event", async () => {
        const { service, userRepo } = createService({
            id: 1,
            totalXp: 100,
        });

        const emitSpy = vi.spyOn(xpEventBus, "emit");

        const result = await service.addXPForUser(
            1,
            "ACCOUNT_LINE_RULE_CREATED"
        );

        expect(userRepo.increment).toHaveBeenCalledWith(
            { id: 1 },
            "totalXp",
            10
        );

        expect(emitSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "xp.updated",
                userId: 1,
                gainedXp: 10,
                previousTotalXp: 100,
                newTotalXp: 110,
                eventId: expect.any(String),
                occurredAt: expect.any(String),
            })
        );

        expect(result).toEqual({
            id: 1,
            totalXp: 110,
        });
    });

    it("applies the multiplicator when adding XP", async () => {
        const service = new UserXpService();

        const userRepo = {
            findOne: vi
                .fn()
                .mockResolvedValueOnce({
                    id: 1,
                    totalXp: 50,
                })
                .mockResolvedValueOnce({
                    id: 1,
                    totalXp: 70,
                }),
            increment: vi.fn(),
        };

        (service as unknown as { userRepo: typeof userRepo }).userRepo =
            userRepo;

        await service.addXPForUser(
            1,
            "ACCOUNT_LINE_RULE_CREATED",
            2
        );

        expect(userRepo.increment).toHaveBeenCalledWith(
            { id: 1 },
            "totalXp",
            20
        );
    });

    it("throws UserNotFoundError when the user does not exist", async () => {
        const { service, userRepo } = createService(null);

        await expect(
            service.addXPForUser(
                999,
                "ACCOUNT_LINE_RULE_CREATED"
            )
        ).rejects.toBeInstanceOf(UserNotFoundError);

        expect(userRepo.increment).not.toHaveBeenCalled();
    });

    it("throws UserNotFoundError when userId is missing", async () => {
        const { service, userRepo } = createService(null);

        await expect(
            service.addXPForUser(
                0,
                "ACCOUNT_LINE_RULE_CREATED"
            )
        ).rejects.toBeInstanceOf(UserNotFoundError);

        expect(userRepo.increment).not.toHaveBeenCalled();
    });

    it("uses the correct XP amount for each action", async () => {
        const { service, userRepo } = createService({
            id: 1,
            totalXp: 0,
        });

        await service.addXPForUser(
            1,
            "KANBAN_TASK_COMPLETED"
        );

        expect(userRepo.increment).toHaveBeenCalledWith(
            { id: 1 },
            "totalXp",
            UserXpActionsPoints.KANBAN_TASK_COMPLETED
        );
    });
});
