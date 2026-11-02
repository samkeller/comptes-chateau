import {USER_XP_CATEGORIES } from "@chocosous/shared";

type UserXpCategoryKey = keyof typeof USER_XP_CATEGORIES;

export type UserXpCategory = {
    key: UserXpCategoryKey;
    label: (typeof USER_XP_CATEGORIES)[UserXpCategoryKey];
    color: "info" | "success" | "warning" | "danger";
};

export const EmptyUserXpCategory: UserXpCategory = {
    key: "ACCOUNTING",
    label: "Comptabilité",
    color: "info",
};

function buildFromCategoryKey(category: UserXpCategoryKey): UserXpCategory {
    const colors = {
        ACCOUNTING: "info",
        KANBAN: "success",
        STOCK: "warning",
        BANKING: "danger",
    } as const;

    return {
        key: category,
        label: USER_XP_CATEGORIES[category],
        color: colors[category],

    };
}

export { buildFromCategoryKey };