import { AppDataSource } from "../../../db/dataSource";
import customLog from "../../../jobs/customLog";
import type { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { User } from "../entities/User";
import { xpEventBus } from "../events/XpEventBus";
import { USER_XP_ACTIONS, type UserXpActionsPointsKeys, type XpUpdatedEvent } from "@chocosous/shared";
import { UserNotFoundError } from "./errors/UserNotFoundError";
import { UserXpLog } from "../entities/UserXpLog";

type XpEventPublisher = (event: XpUpdatedEvent) => void;

export default class UserXpService {
    private userRepo: Repository<User>;
    private userXpLogRepo: Repository<UserXpLog>;

    constructor(
        private readonly manager = AppDataSource.manager,
        private readonly publishXpEvent: XpEventPublisher = (event) => xpEventBus.emit(event),
    ) {
        this.userRepo = manager.getRepository(User);
        this.userXpLogRepo = manager.getRepository(UserXpLog);
    }

    async addXPForUser(userId: number, action: UserXpActionsPointsKeys, multiplicator: number = 1): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });

        if (!userId || !user) throw new UserNotFoundError(`User with id ${userId} not found`);

        const actionXp = USER_XP_ACTIONS[action].xp; 
        const previousTotalXp = user.totalXp;
        const gainedXp = actionXp * multiplicator;

        // Transaction : Log XP et update user vont de pair.
        const { updatedUser } = await this.manager.transaction(async (manager) => {
            const userXpLogRepo = manager.getRepository(UserXpLog);
            const userRepo = manager.getRepository(User);

            await userRepo.increment({ id: userId }, "totalXp", gainedXp);

            const updatedUser = await userRepo.findOne({ where: { id: userId } });

            if (!updatedUser) throw new UserNotFoundError(`User with id ${userId} not found`);

            const xpLog = userXpLogRepo.create({
                userId: userId,
                action: action,
                actionXp: actionXp,
                multiplicator: multiplicator,
            });

            await userXpLogRepo.save(xpLog);

            return { updatedUser };
        });

        customLog("INFO", `Added ${gainedXp} XP to user with id ${userId}`, "service");

        const gainedEvent: XpUpdatedEvent = {
            eventId: randomUUID(),
            type: "xp.updated",
            userId,
            occurredAt: new Date().toISOString(),
            gainedXp,
            previousTotalXp,
            newTotalXp: updatedUser.totalXp,
        };

        this.publishXpEvent(gainedEvent);

        return updatedUser;
    }

    getAll(): Promise<UserXpLog[]> {
        return this.userXpLogRepo.find();
    }
}
