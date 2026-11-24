import { generatePath } from "react-router-dom";
import type { NotificationTarget } from "@chocosous/shared";
import { routePaths } from "@/routes/routePaths";
import { kanbanTaskLink } from "@/pages/kanban/kanbanTaskLink";

/** Route front vers laquelle une notification redirige. */
export function notificationTargetPath(target: NotificationTarget): string {
    switch (target.kind) {
        case "kanban": return kanbanTaskLink(target.taskId, target.tab);
        case "stocks": return routePaths.stocks.index;
        case "accountDashboard": return generatePath(routePaths.account.dashboard, { accountId: String(target.accountId) });
        case "accountChecks": return generatePath(routePaths.account.accountChecks, { accountId: String(target.accountId) });
        case "budgetOverview": return generatePath(routePaths.account.budgetOverview, { accountId: String(target.accountId) });
    }
}
