import type { NotificationDto } from "@chocosous/shared";
import type { Notification } from "../entities/Notification";

/** Clé d'une notification événementielle (utilisée pour l'ignorer). */
export function toEventNotificationKey(notificationId: number): string {
    return `EVENT:${notificationId}`;
}

export function toNotificationDto(notification: Notification): NotificationDto {
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
