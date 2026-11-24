import { routePaths } from "@/routes/routePaths";

export type KanbanTaskTab = "task" | "comments";

/** Lien vers le kanban qui ouvre directement une tâche (ex. depuis une notification). */
export function kanbanTaskLink(taskId: number, tab?: "comments"): string {
    const params = new URLSearchParams({ taskId: String(taskId) });
    if (tab) params.set("tab", tab);
    return `${routePaths.kanban}?${params.toString()}`;
}

/** Tâche à ouvrir d'après la query string, ou `null` si aucune (ou invalide). */
export function parseKanbanTaskLink(searchParams: URLSearchParams): { taskId: number; tab: KanbanTaskTab } | null {
    const taskId = Number(searchParams.get("taskId"));
    if (!Number.isInteger(taskId) || taskId <= 0) return null;
    return { taskId, tab: searchParams.get("tab") === "comments" ? "comments" : "task" };
}
