import type { DashboardOverview, NotificationDto } from "@chocosous/shared";
import AccountService from "../../accounts/services/AccountService";
import DashboardService from "../../accounts/services/DashboardService";
import { dailyNotification, formatEuros, type NotificationProvider } from "../NotificationProvider";

/** La notification « opérations à valider » n'apparaît que strictement au-delà de ce nombre. */
export const OPERATIONS_TO_CHECK_THRESHOLD = 5;

export interface AccountSituation {
    id: number;
    label: string;
    overview: Pick<DashboardOverview,
        | "currentBalance"
        | "forecastBalanceMonthEnd"
        | "monthExpenses"
        | "monthlyBudget"
        | "operationsToCheckInAccountCount"
        | "operationsToCheckHorsCompteCount"
    >;
}

/** Règle pure : solde négatif ou bientôt négatif, budget dépassé, opérations à valider. */
export function accountNotifications(accounts: AccountSituation[], now: Date): NotificationDto[] {
    const notifications: NotificationDto[] = [];

    for (const { id, label, overview } of accounts) {
        if (overview.currentBalance < 0) {
            notifications.push(dailyNotification(now, {
                type: "ACCOUNT_NEGATIVE",
                severity: "high",
                title: "Compte dans le rouge",
                message: `Le compte ${label} est à découvert (${formatEuros(overview.currentBalance)}).`,
                target: { kind: "accountDashboard", accountId: id },
            }, id));
        } else if (overview.forecastBalanceMonthEnd < 0) {
            notifications.push(dailyNotification(now, {
                type: "ACCOUNT_GOING_NEGATIVE",
                severity: "medium",
                title: "Compte bientôt dans le rouge",
                message: `Le solde prévisionnel du compte ${label} sera de ${formatEuros(overview.forecastBalanceMonthEnd)} en fin de mois.`,
                target: { kind: "accountDashboard", accountId: id },
            }, id));
        }

        if (overview.monthlyBudget > 0 && overview.monthExpenses > overview.monthlyBudget) {
            notifications.push(dailyNotification(now, {
                type: "ACCOUNT_BUDGET_EXCEEDED",
                severity: "medium",
                title: "Budget mensuel dépassé",
                message: `Compte ${label} : ${formatEuros(overview.monthExpenses)} dépensés pour un budget de ${formatEuros(overview.monthlyBudget)}.`,
                target: { kind: "budgetOverview", accountId: id },
            }, id));
        }

        const operationsToCheck = overview.operationsToCheckInAccountCount + overview.operationsToCheckHorsCompteCount;
        if (operationsToCheck > OPERATIONS_TO_CHECK_THRESHOLD) {
            notifications.push(dailyNotification(now, {
                type: "OPERATIONS_TO_CHECK",
                severity: "medium",
                title: `${operationsToCheck} opérations à valider`,
                message: `Il y a ${operationsToCheck} opérations à valider sur le compte ${label}.`,
                target: { kind: "accountChecks", accountId: id },
            }, id));
        }
    }

    return notifications;
}

export const accountNotificationProvider: NotificationProvider = {
    name: "accounts",
    async collect({ manager, now }) {
        const dashboardService = new DashboardService(manager);
        const accounts = await new AccountService(manager).getAll();
        const situations = await Promise.all(accounts.map(async (account) => ({
            id: account.id,
            label: account.label,
            overview: await dashboardService.getOverview(account.id),
        })));
        return accountNotifications(situations, now);
    },
};
