import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { generatePath, useNavigate } from "react-router-dom";
import type { NotificationDto, NotificationSeverity, NotificationTarget } from "@chocosous/shared";
import NotificationService from "@/services/NotificationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { formatDistanceToNow } from "@/utils/DatesUtils";
import { routePaths } from "@/routes/routePaths";

const severityStyles: Record<NotificationSeverity, { icon: string; className: string }> = {
    high: { icon: "pi pi-exclamation-circle", className: "border-l-red-500 text-red-500" },
    medium: { icon: "pi pi-exclamation-triangle", className: "border-l-orange-400 text-orange-400" },
    info: { icon: "pi pi-info-circle", className: "border-l-primary-400 text-primary-500" },
};

function toPath(target: NotificationTarget): string {
    switch (target.kind) {
        case "kanban": return routePaths.kanban;
        case "stocks": return routePaths.stocks.index;
        case "accountDashboard": return generatePath(routePaths.account.dashboard, { accountId: String(target.accountId) });
        case "accountChecks": return generatePath(routePaths.account.accountChecks, { accountId: String(target.accountId) });
        case "budgetOverview": return generatePath(routePaths.account.budgetOverview, { accountId: String(target.accountId) });
    }
}

export default function HomeNotificationsCard() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        new NotificationService().getAll()
            .then((data) => { if (isMounted) setNotifications(data); })
            // L'intercepteur axios affiche déjà l'erreur : la carte reste simplement vide.
            .catch(() => undefined)
            .finally(() => { if (isMounted) setLoading(false); });
        return () => { isMounted = false; };
    }, []);

    const dismiss = (key: string) => {
        new NotificationService().dismiss(key)
            .then(() => setNotifications((current) => current.filter((notification) => notification.key !== key)))
            // L'intercepteur axios affiche déjà l'erreur : la notification reste affichée.
            .catch(() => undefined);
    };

    const open = (target: NotificationTarget) => {
        if ("accountId" in target) {
            new LocalStorageUtils().setActiveAccountId(target.accountId);
        }
        navigate(toPath(target));
    };

    return (
        <Card title="Notifications" className="h-full">
            {loading && (
                <div className="flex justify-center py-8">
                    <ProgressSpinner style={{ width: "2.5rem", height: "2.5rem" }} />
                </div>
            )}
            {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-12">
                    <i className="pi pi-check-circle text-green-500 text-4xl" />
                    <span className="text-surface-500 text-base">All done !</span>
                </div>
            )}
            {!loading && notifications.length > 0 && (
                <ul className="m-0 flex max-h-[28rem] list-none flex-col gap-2 overflow-y-auto p-0">
                    {notifications.map((notification) => {
                        const style = severityStyles[notification.severity];
                        return (
                            <li
                                key={notification.key}
                                className={`flex items-start gap-3 rounded-md border border-l-4 border-surface-200 p-3 ${style.className}`}
                            >
                                <i className={`${style.icon} mt-1`} />
                                <div className="min-w-0 flex-1 text-surface-700">
                                    <div className="font-semibold text-surface-900">{notification.title}</div>
                                    <div className="text-sm break-words">{notification.message}</div>
                                    <small className="text-surface-500">{formatDistanceToNow(new Date(notification.occurredAt))}</small>
                                </div>
                                <div className="flex shrink-0 items-center">
                                    {notification.target && (
                                        <Button
                                            icon="pi pi-arrow-right"
                                            text
                                            rounded
                                            size="small"
                                            tooltip="Voir"
                                            tooltipOptions={{ position: "top" }}
                                            onClick={() => open(notification.target!)}
                                        />
                                    )}
                                    <Button
                                        icon="pi pi-times"
                                        text
                                        rounded
                                        size="small"
                                        severity="secondary"
                                        tooltip="Ignorer"
                                        tooltipOptions={{ position: "top" }}
                                        onClick={() => dismiss(notification.key)}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}
