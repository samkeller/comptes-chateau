import type { NotificationProvider } from "../NotificationProvider";
import { accountNotificationProvider } from "./accountNotifications";
import { jobNotificationProvider } from "./jobNotifications";
import { stockNotificationProvider } from "./stockNotifications";

/**
 * Registre des notifications d'état.
 * Ajouter une notification = écrire un provider dans ce dossier et l'ajouter ici.
 * (Les notifications événementielles, elles, se publient via `NotificationService.publish`.)
 */
export const notificationProviders: NotificationProvider[] = [
    accountNotificationProvider,
    stockNotificationProvider,
    jobNotificationProvider,
];
