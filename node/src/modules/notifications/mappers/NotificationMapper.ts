import type { Notification } from "../entities/Notification";
import type { NotificationDraft } from "../NotificationProvider";

/** Clé d'une notification événementielle (utilisée pour l'ignorer). */
export function toEventNotificationKey(notificationId: number): string {
    return `EVENT:${notificationId}`;
}

export function toNotificationDraft(notification: Notification): NotificationDraft {
    return {
        key: toEventNotificationKey(notification.id),
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        occurredAt: notification.createdAt.toISOString(),
        target: notification.target,
    };
}
