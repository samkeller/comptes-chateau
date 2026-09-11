import { describe, expect, it, vi, beforeEach } from "vitest";
import UserXpService from "./UserXpService";
import { UserNotFoundError } from "./errors/UserNotFoundError";
import { UserXpActionsPoints } from "../utils/UserXPUtils";
import { xpEventBus } from "../events/XpEventBus";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../entities/User";

describe("UserXpService.addXPForUser", () => {
    let service: UserXpService;

    beforeEach(() => {
        vi.restoreAllMocks();
        service = new UserXpService(testDataSource.manager);
    });

    it("adds XP to a user and emits an xp.updated event", async () => {
        const emitSpy = vi.spyOn(xpEventBus, "emit");

        const result = await service.addXPForUser(
            TEST_USER_ID,
            "ACCOUNT_LINE_RULE_CREATED"
        );

        expect(emitSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "xp.updated",
                userId: TEST_USER_ID,
                gainedXp: 10,
                previousTotalXp: 100,
                newTotalXp: 110,
                eventId: expect.any(String),
                occurredAt: expect.any(String),
            })
        );

        expect(result).toMatchObject({
            id: TEST_USER_ID,
            totalXp: 110,
        });
    });

    it("applies the multiplicator when adding XP", async () => {
        await service.addXPForUser(
            TEST_USER_ID,
            "ACCOUNT_LINE_RULE_CREATED",
            2
        );

        const user = await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID });
        expect(user.totalXp).toBe(120);
    });

    it("throws UserNotFoundError when the user does not exist", async () => {
        await expect(
            service.addXPForUser(
                999,
                "ACCOUNT_LINE_RULE_CREATED"
            )
        ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it("throws UserNotFoundError when userId is missing", async () => {
        await expect(
            service.addXPForUser(
                0,
                "ACCOUNT_LINE_RULE_CREATED"
            )
        ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it("uses the correct XP amount for each action", async () => {
        await service.addXPForUser(
            TEST_USER_ID,
            "KANBAN_TASK_COMPLETED"
        );

        const user = await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID });
        expect(user.totalXp).toBe(100 + UserXpActionsPoints.KANBAN_TASK_COMPLETED);
    });
});
