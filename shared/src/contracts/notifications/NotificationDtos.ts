import { z } from "zod";

export const NOTIFICATION_SEVERITIES = ["info", "medium", "high"] as const;
export type NotificationSeverity = typeof NOTIFICATION_SEVERITIES[number];

/** Écran vers lequel une notification redirige (le front résout la route). */
export type NotificationTarget =
    | { kind: "kanban"; taskId: number }
    | { kind: "stocks" }
    | { kind: "accountDashboard"; accountId: number }
    | { kind: "accountChecks"; accountId: number }
    | { kind: "budgetOverview"; accountId: number };

export interface NotificationDto {
    /**
     * Identifiant stable, utilisé pour ignorer la notification.
     * Les notifications d'état incluent la date du jour : les ignorer les masque jusqu'au lendemain.
     */
    key: string;
    /** Type libre (ex. `ACCOUNT_NEGATIVE`), défini par le provider back qui l'émet. */
    type: string;
    severity: NotificationSeverity;
    title: string;
    message: string;
    /** Date ISO de l'événement (ou du calcul pour une notification d'état). */
    occurredAt: string;
    target: NotificationTarget | null;
}

export const DismissNotificationSchema = z.object({
    key: z.string().trim().min(1).max(255),
});
export type DismissNotificationRequest = z.infer<typeof DismissNotificationSchema>;
