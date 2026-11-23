import type { NotificationDto, NotificationSeverity, NotificationTarget } from "@chocosous/shared";
import type { EntityManager } from "typeorm";
import { formatApiDate } from "../../utils/DateUtils";

export interface NotificationContext {
    now: Date;
    manager: EntityManager;
}

/**
 * Source de notifications d'état (calculées à la lecture, jamais persistées).
 *
 * Pour ajouter une notification : créer un provider dans `providers/` et l'ajouter à `notificationProviders`.
 * Bonne pratique : séparer la lecture des données (`collect`) d'une règle pure, testable sans base.
 */
export interface NotificationProvider {
    name: string;
    collect(context: NotificationContext): Promise<NotificationDto[]>;
}

export interface NotificationContent {
    type: string;
    severity: NotificationSeverity;
    title: string;
    message: string;
    target: NotificationTarget | null;
}

/**
 * Notification d'état valable pour la journée : la clé inclut la date,
 * donc une notification ignorée réapparaît le lendemain si la situation persiste.
 *
 * @param scope Distingue plusieurs notifications d'un même type (ex. l'id du compte).
 */
export function dailyNotification(now: Date, content: NotificationContent, scope?: string | number): NotificationDto {
    return {
        ...content,
        key: [content.type, scope, formatApiDate(now)].filter((part) => part !== undefined).join(":"),
        occurredAt: now.toISOString(),
    };
}

const euroFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatEuros(amount: number): string {
    return euroFormatter.format(amount);
}
