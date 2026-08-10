import { AppDataSource } from "../../../db/dataSource";
import customLog from "../../../jobs/customLog";
import { randomUUID } from "crypto";
import { User } from "../entities/User";
import { UserXpActionsPoints, UserXpActionsPointsKeys } from "../utils/UserXPUtils";
import { xpEventBus } from "../events/XpEventBus";
import { XpUpdatedEvent } from "../events/XpEvents";
import { UserNotFoundError } from "./errors/UserNotFoundError";

export default class UserXpService {

    private userRepo = AppDataSource.getRepository(User);

    async addXPForUser(userId: number, action: UserXpActionsPointsKeys, multiplicator: number = 1): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
 
        if (!user) throw new UserNotFoundError(`User with id ${userId} not found`);

        const previousTotalXp = user.totalXp;
        const gainedXp = UserXpActionsPoints[action] * multiplicator;

        user.totalXp += gainedXp;

        customLog("INFO", `Added ${gainedXp} XP to user with id ${userId}`, "service");

        await this.userRepo.save(user);

        const gainedEvent: XpUpdatedEvent = {
            eventId: randomUUID(),
            type: "xp.updated",
            userId,
            occurredAt: new Date().toISOString(),
            gainedXp,
            previousTotalXp,
            newTotalXp: user.totalXp,
        };

        xpEventBus.emit(gainedEvent);

        return user;
    }
}

