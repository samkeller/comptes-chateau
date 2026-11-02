export const USER_XP_CATEGORIES = {
    ACCOUNTING: "Comptabilité",
    KANBAN: "Gestion de tâches",
    STOCK: "Gestion des stocks",
    BANKING: "Opérations bancaires",
} as const;

type UserXpCategory = keyof typeof USER_XP_CATEGORIES;

type UserXpActionDefinition = {
    xp: number;
    label: string;
    category: UserXpCategory;
};

export const USER_XP_ACTIONS = {
    ACCOUNT_LINE_RULE_CREATED: {
        xp: 10,
        label: "Règle comptable créée",
        category: "ACCOUNTING",
    },
    ACCOUNT_LINE_OPERATION_CREATED: {
        xp: 5,
        label: "Opération comptable créée",
        category: "ACCOUNTING",
    },
    ACCOUNT_LINE_OPERATION_VALIDATED: {
        xp: 20,
        label: "Opération comptable validée",
        category: "ACCOUNTING",
    },
    ACCOUNT_RECURRING_EXPENSE_CREATED: {
        xp: 100,
        label: "Dépense récurrente créée",
        category: "ACCOUNTING",
    },
    KANBAN_TASK_COMPLETED: {
        xp: 40,
        label: "Tâche terminée",
        category: "KANBAN",
    },
    KANBAN_TASK_CREATED: {
        xp: 10,
        label: "Tâche créée",
        category: "KANBAN",
    },
    STOCK_ITEM_CREATED: {
        xp: 40,
        label: "Article créé",
        category: "STOCK",
    },
    STOCK_UNIT_CREATED: {
        xp: 20,
        label: "Unité ajoutée",
        category: "STOCK",
    },
    STOCK_UNIT_TAKE: {
        xp: 10,
        label: "Cotché",
        category: "STOCK",
    },
    BANQUE_POSTALE_OPERATION_IMPORTED: {
        xp: 10,
        label: "Opération bancaire importée",
        category: "BANKING",
    },
    BANQUE_POSTALE_OPERATION_LINKED: {
        xp: 10,
        label: "Opération bancaire associée",
        category: "BANKING",
    },
} as const satisfies Record<string, UserXpActionDefinition>

export type UserXpActionsPointsKeys = keyof typeof USER_XP_ACTIONS;