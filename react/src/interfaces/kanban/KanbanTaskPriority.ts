export const KANBAN_TASK_PRIORITIES = ["low", "normal", "high"] as const;

export type KanbanTaskPriority = (typeof KANBAN_TASK_PRIORITIES)[number];
