import {
    USER_XP_ACTIONS,
    UserXpActionDto,
    UserXpActionsPointsKeys,
} from "@chocosous/shared";
import { EmptyUserXpCategory, UserXpCategory, buildFromCategoryKey } from "./UserXpCategory";

export class UserXpAction {
    key: UserXpActionsPointsKeys = "ACCOUNT_LINE_OPERATION_CREATED";
    xp: number = 0;
    label: string = "";
    category: UserXpCategory = EmptyUserXpCategory;

    constructor(data: Partial<UserXpActionDto>) {
        Object.assign(this, data);

        this.category = buildFromCategoryKey(USER_XP_ACTIONS[this.key].category);
    }
}