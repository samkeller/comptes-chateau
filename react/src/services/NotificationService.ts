import axios from "axios";
import BaseService from "./BaseService";
import type { DismissNotificationRequest, NotificationDto } from "@chocosous/shared";

export default class NotificationService extends BaseService {
    /** Notifications de l'utilisateur connecté, les plus importantes d'abord. */
    getAll(): Promise<NotificationDto[]> {
        return axios.get<NotificationDto[]>(`${this.apiUrl}/notifications`).then((response) => response.data);
    }

    dismiss(key: string): Promise<void> {
        const body: DismissNotificationRequest = { key };
        return axios.post(`${this.apiUrl}/notifications/dismiss`, body).then(() => undefined);
    }
}
