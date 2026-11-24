import StockUnitService from "../../stocks/services/StockUnitService";
import { dailyNotification, type NotificationDraft, type NotificationProvider } from "../NotificationProvider";

export interface StockExpirySituation {
    expiredItemLabels: string[];
    expiringSoonItemLabels: string[];
}

const MAX_LISTED_LABELS = 3;

/** « A, B, C et 2 autres » */
function summarizeLabels(labels: string[]): string {
    const listed = labels.slice(0, MAX_LISTED_LABELS).join(", ");
    const remaining = labels.length - MAX_LISTED_LABELS;
    if (remaining <= 0) return listed;
    return `${listed} et ${remaining} autre${remaining > 1 ? "s" : ""}`;
}

function plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** Règle pure : une notification pour les produits périmés, une pour ceux qui périment sous 30 jours. */
export function stockNotifications(situation: StockExpirySituation, now: Date): NotificationDraft[] {
    const notifications: NotificationDraft[] = [];
    const { expiredItemLabels, expiringSoonItemLabels } = situation;

    if (expiredItemLabels.length > 0) {
        notifications.push(dailyNotification(now, {
            type: "STOCK_EXPIRED",
            severity: "high",
            title: plural(expiredItemLabels.length, "produit périmé", "produits périmés"),
            message: summarizeLabels(expiredItemLabels),
            target: { kind: "stocks" },
        }));
    }

    if (expiringSoonItemLabels.length > 0) {
        notifications.push(dailyNotification(now, {
            type: "STOCK_EXPIRING_SOON",
            severity: "medium",
            title: plural(expiringSoonItemLabels.length, "produit périme bientôt", "produits périment bientôt"),
            message: summarizeLabels(expiringSoonItemLabels),
            target: { kind: "stocks" },
        }));
    }

    return notifications;
}

export const stockNotificationProvider: NotificationProvider = {
    name: "stocks",
    async collect({ manager, now }) {
        return stockNotifications(await new StockUnitService(manager).getExpiringItemLabels(now), now);
    },
};
