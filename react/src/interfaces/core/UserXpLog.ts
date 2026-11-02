import { USER_XP_ACTIONS, UserXpActionsPointsKeys, UserXpLogDto } from "@chocosous/shared";
import { buildFromCategoryKey, EmptyUserXpCategory, type UserXpCategory } from "./UserXpCategory";

export class UserXpLog {
    id: number = 0;
    action: UserXpActionsPointsKeys = "ACCOUNT_LINE_OPERATION_CREATED";
    actionXp: number = 0;
    multiplicator: number = 1;
    createdAt: Date = new Date();
    category: UserXpCategory = EmptyUserXpCategory;


    constructor(user: Partial<UserXpLogDto>) {
        Object.assign(this, user);
        if (user?.createdAt) {
            this.createdAt = new Date(user.createdAt);
        }
        this.category = buildFromCategoryKey(USER_XP_ACTIONS[this.action].category);
    }

    /**
     * Trop verbeux pour ne pas utiliser un getter (imo)
     */
    get label(): (typeof USER_XP_ACTIONS)[UserXpActionsPointsKeys]["label"] {
        return USER_XP_ACTIONS[this.action as keyof typeof USER_XP_ACTIONS].label;
    }
}