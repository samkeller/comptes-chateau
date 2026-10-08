
/**
 * Routes front de l'application
 * 
 * @example
 * import { routePaths } from '@/routes/routePaths';
 * console.log(routePaths.home); // "/"
 * 
 * @example
 * import { navigateToAccount } from '@/routes/routePaths';
 * import { generatePath, useNavigate } from "react-router-dom";
 * navigate(generatePath(routePaths.account.root, { accountId: 1 }));
 */

export const routePaths = {
    home: "/",
    auth: "/auth",
    account: {
        root: "/:accountId",
        dashboard: "/:accountId/dashboard",
        accountBook: "/:accountId/accountBook",
        accountBookDialog: "/:accountId/accountBook/:accountLineId",
        accountChecks: "/:accountId/accountChecks",
        budget: "/:accountId/budget",
        budgetOverview: "/:accountId/budget/overview",
        recurringExpenses: "/:accountId/budget/recurringExpenses",
        recurringExpenseDialog: "/:accountId/budget/recurringExpenses/:expenseId",
        budgetLines: "/:accountId/budget/budgetLines",
    },
    setup: "/setup",
    automatisations: "/automatisations",
    kanban: "/kanban",
    notes: "/notes",
    stocks: {
        index: "/stocks",
        /** Ancienne route du scan rapide, redirigée vers `/stocks?action=scan`. */
        scan: "/stocks/scan",
    },
} as const;
