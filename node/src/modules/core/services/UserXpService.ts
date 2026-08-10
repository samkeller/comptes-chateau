import { AppDataSource } from "../../../db/dataSource";
import customLog from "../../../jobs/customLog";
import { User } from "../entities/User";
import { UserXpActionsPoints, UserXpActionsPointsKeys } from "../utils/UserXPUtils";
import { UserNotFoundError } from "./errors/UserNotFoundError";

export default class UserXpService {

    private userRepo = AppDataSource.getRepository(User);

    async addXPForUser(userId: number, action: UserXpActionsPointsKeys): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
 
        if (!user) throw new UserNotFoundError(`User with id ${userId} not found`);

        user.totalXp += UserXpActionsPoints[action];

        customLog("INFO", `Added ${UserXpActionsPoints[action]} XP to user with id ${userId}`, "service");

        await this.userRepo.save(user);
        return user;
    }
}

