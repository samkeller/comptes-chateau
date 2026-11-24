import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate } from "react-router-dom";
import type { NotificationDto, NotificationSeverity, NotificationTarget } from "@chocosous/shared";
import NotificationService from "@/services/NotificationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import NotificationItem from "./NotificationItem";
import { notificationTargetPath } from "./notificationTargetPath";
import { TabPanel, TabPanelHeaderTemplateOptions, TabView } from "primereact/tabview";
import { Badge } from "primereact/badge";
import { ScrollPanel } from "primereact/scrollpanel";

/** Durée de l'animation de sortie d'une notification ignorée (cf. `duration-300` de NotificationItem). */
const DISMISS_ANIMATION_MS = 300;

const badgeColorBySeverity: Record<NotificationSeverity, string> = {
    high: "bg-red-500",
    medium: "bg-orange-400",
    info: "bg-primary-500",
};

function highestSeverity(notifications: NotificationDto[]): NotificationSeverity {
    if (notifications.some((notification) => notification.severity === "high")) return "high";
    if (notifications.some((notification) => notification.severity === "medium")) return "medium";
    return "info";
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NotificationBellProps {
    buttonClassName?: string;
}

/** Cloche de l'en-tête : badge du nombre de notifications actives, panneau avec actives puis ignorées. */
export default function NotificationBell({ buttonClassName }: NotificationBellProps) {
    const navigate = useNavigate();
    const panelRef = useRef<OverlayPanel>(null);
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const load = useCallback(() => new NotificationService().getAll()
        .then(setNotifications)
        .finally(() => setLoading(false)), []);

    useEffect(() => {
        void load();
    }, [load]);

    const active = notifications.filter((notification) => !notification.dismissed);
    const dismissed = notifications.filter((notification) => notification.dismissed);

    const dismiss = (key: string) => {
        Promise.all([new NotificationService().dismiss(key), wait(DISMISS_ANIMATION_MS)])
            .then(() => setNotifications((current) => current.map((notification) => (
                notification.key === key ? { ...notification, dismissed: true } : notification
            ))))
    };

    const open = (target: NotificationTarget) => {
        if ("accountId" in target) {
            new LocalStorageUtils().setActiveAccountId(target.accountId);
        }
        panelRef.current?.hide();
        navigate(notificationTargetPath(target));
    };

    const renderItem = (notification: NotificationDto) => (
        <NotificationItem
            key={notification.key}
            notification={notification}
            onOpen={notification.target ? () => open(notification.target!) : undefined}
            onDismiss={() => dismiss(notification.key)}
        />
    );

    const panelHeaderTemplate = (options: TabPanelHeaderTemplateOptions, label: string, count?: number) => {
        return (
            <div
                className={`flex align-items-center gap-2 p-3 ${options.selected ? 'border-b' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={options.onClick}
            >
                <span className="font-bold white-space-nowrap">{label}
                    {
                        count !== undefined && (
                            <Badge value={count} className="ml-2" />
                        )
                    }
                </span>
            </div>
        );
    }

    return (
        <>
            <div className="relative">
                <Button
                    icon="pi pi-bell"
                    className={buttonClassName}
                    text
                    rounded
                    aria-label={`Notifications (${active.length})`}
                    tooltip="Notifications"
                    tooltipOptions={{ position: "bottom" }}
                    onClick={(event) => {
                        panelRef.current?.toggle(event);
                        void load();
                    }}
                />
                {active.length > 0 && (
                    <Badge value={active.length} className="absolute top-0 right-0 text-xs min-w-4 w-4 h-4"  severity="danger" />
                )}
            </div>
            <OverlayPanel
                ref={panelRef}
                className="w-[24rem] max-w-[calc(100vw-1rem)]"
            >
                {loading && notifications.length === 0 ? (
                    <div className="flex justify-center py-6">
                        <ProgressSpinner style={{ width: "2rem", height: "2rem" }} />
                    </div>
                ) : (
                    <TabView
                        pt={{
                            nav: { className: "border-0" },
                            panelContainer: { className: "p-1" }
                        }}
                    >
                        <TabPanel
                            header="All"
                            headerTemplate={(options) =>
                                panelHeaderTemplate(options, "All", active.length)
                            }
                        >
                            <ScrollPanel style={{ width: "100%", height: "400px" }}>
                                {active.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-6">
                                        <i className="pi pi-check-circle text-3xl text-green-500" />
                                        <span className="text-surface-500">All done !</span>
                                    </div>
                                ) : (
                                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                                        {active.map(renderItem)}
                                    </ul>
                                )}
                            </ScrollPanel>
                        </TabPanel>

                        <TabPanel
                            header="Dismissed"
                            headerTemplate={(options) =>
                                panelHeaderTemplate(options, "Dismissed")
                            }
                        >
                            <ScrollPanel style={{ width: "100%", height: "400px" }}>
                                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                                    {dismissed.map(renderItem)}
                                </ul>
                            </ScrollPanel>
                        </TabPanel>
                    </TabView>
                )}
            </OverlayPanel>
        </>
    );
}
