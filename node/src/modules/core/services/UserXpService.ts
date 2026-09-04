import { AppDataSource } from "../../../db/dataSource";
import customLog from "../../../jobs/customLog";
import { randomUUID } from "crypto";
import { User } from "../entities/User";
import { UserXpActionsPoints, UserXpActionsPointsKeys } from "../utils/UserXPUtils";
import { xpEventBus } from "../events/XpEventBus";
import type { XpUpdatedEvent } from "@chocosous/shared";
import { UserNotFoundError } from "./errors/UserNotFoundError";

export default class UserXpService {

    private userRepo = AppDataSource.getRepository(User);

    async addXPForUser(userId: number, action: UserXpActionsPointsKeys, multiplicator: number = 1): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
 
        if (!userId || !user) throw new UserNotFoundError(`User with id ${userId} not found`);

        const previousTotalXp = user.totalXp;
        const gainedXp = UserXpActionsPoints[action] * multiplicator;

        await this.userRepo.increment({ id: userId }, "totalXp", gainedXp);
        customLog("INFO", `Added ${gainedXp} XP to user with id ${userId}`, "service");

        const updatedUser = await this.userRepo.findOne({ where: { id: userId } });

        const gainedEvent: XpUpdatedEvent = {
            eventId: randomUUID(),
            type: "xp.updated",
            userId,
            occurredAt: new Date().toISOString(),
            gainedXp,
            previousTotalXp,
            newTotalXp: updatedUser!.totalXp,
        };

        xpEventBus.emit(gainedEvent);

        return updatedUser!;
    }
}

