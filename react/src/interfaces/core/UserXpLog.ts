import { USER_XP_ACTIONS, UserXpActionsPointsKeys, UserXpLogDto } from "@chocosous/shared";
import { buildFromCategoryKey, EmptyUserXpCategory, type UserXpCategory } from "./UserXpCategory";
import { User } from "./User";

export class UserXpLog {
    id: number = 0;
    action: UserXpActionsPointsKeys = "ACCOUNT_LINE_OPERATION_CREATED";
    actionXp: number = 0;
    multiplicator: number = 1;
    createdAt: Date = new Date();
    category: UserXpCategory = EmptyUserXpCategory;
    user: User = new User({});


    constructor(userXpLog: Partial<UserXpLogDto>) {
        Object.assign(this, userXpLog);
        if (userXpLog?.createdAt) {
            this.createdAt = new Date(userXpLog.createdAt);
        }
        this.category = buildFromCategoryKey(USER_XP_ACTIONS[this.action].category);
        if (userXpLog?.user) {
            this.user = new User(userXpLog.user);
        }
    }

    /**
     * Trop verbeux pour ne pas utiliser un getter (imo)
     */
    get label(): (typeof USER_XP_ACTIONS)[UserXpActionsPointsKeys]["label"] {
        return USER_XP_ACTIONS[this.action as keyof typeof USER_XP_ACTIONS].label;
    }
}