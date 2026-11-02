import type { UserXpActionsPointsKeys } from "./UserXpActions";

export interface UserXpActionDto {
    key: UserXpActionsPointsKeys;
    xp: number;
    label: string;
    category: string;
}

export interface UserXpLogDto {
    id: number;
    action: UserXpActionsPointsKeys;
    actionXp: number;
    multiplicator: number;
    createdAt: string;
}