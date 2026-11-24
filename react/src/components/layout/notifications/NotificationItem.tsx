import { Button } from "primereact/button";
import { useState } from "react";
import type { NotificationDto, NotificationSeverity } from "@chocosous/shared";
import { formatDistanceToNow } from "@/utils/DatesUtils";

const severityStyles: Record<NotificationSeverity, { icon: string; accent: string }> = {
    high: { icon: "pi pi-exclamation-circle", accent: "border-l-red-500 text-red-500" },
    medium: { icon: "pi pi-exclamation-triangle", accent: "border-l-orange-400 text-orange-400" },
    info: { icon: "pi pi-info-circle", accent: "border-l-primary-400 text-primary-500" },
};

interface NotificationItemProps {
    notification: NotificationDto;
    /** Animation de sortie en cours (après « Ignorer »). */
    onOpen?: () => void;
    onDismiss?: () => void;
}

/**
 * Ligne de notification : toute la ligne est cliquable quand la notification a une cible.
 * Une notification ignorée est atténuée et n'a plus de bouton « Ignorer ».
 */
export default function NotificationItem({ notification, onOpen, onDismiss }: NotificationItemProps) {
    const style = severityStyles[notification.severity];
    const isClickable = Boolean(onOpen);
    const [isDismissing, setIsDismissing] = useState(false);

    const handleDismiss = async () => {
        if (!onDismiss || isDismissing) return;

        await onDismiss();
        setIsDismissing(true);
    };

    return (
        <li
            className={[
                "group relative flex items-center gap-3 overflow-hidden",
                "rounded-lg",
                "transition-all duration-300 ease-in-out",
                isClickable ? "hover:bg-surface-100" : "",
                notification.dismissed ? "opacity-60" : "",
                isDismissing
                    ? "translate-x-6 scale-95 opacity-0 max-h-0"
                    : "max-h-40 opacity-100",
            ].join(" ")}
        >
            {/* Indicateur de sévérité */}
            <div className={`absolute inset-y-0 left-0 w-1 ${style.accent.split(" ")[0]}`} />

            {/* Contenu */}
            <div
                className={[
                    "flex min-w-0 flex-1 items-center gap-3 py-3 pl-4",
                    onOpen ? "cursor-pointer" : "",
                ].join(" ")}
                onClick={onOpen}
                role={onOpen ? "button" : undefined}
                tabIndex={onOpen ? 0 : undefined}
                onKeyDown={
                    onOpen
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onOpen();
                            }
                        }
                        : undefined
                }
            >
                <div className="min-h-0 min-w-0 flex items-center justify-center">
                    <i
                        className={`${style.icon} ${style.accent.split(" ")[1]} text-lg`}
                        aria-hidden="true"
                    />
                </div>


                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                        <h4 className="min-w-0 truncate text-surface-900">
                            {notification.title}
                        </h4>
                    </div>
                    <time className="shrink-0 text-[11px] font-medium text-surface-400">
                        {formatDistanceToNow(
                            new Date(notification.occurredAt)
                        )}
                    </time>

                    <p className="text-sm text-surface-600 line-clamp-2">
                        {notification.message}
                    </p>
                </div>

            </div>

            {/* Action secondaire */}
            {onDismiss && !notification.dismissed && (
                <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="secondary"
                    size="small"
                    aria-label="Ignorer la notification"
                    tooltip="Ignorer"
                    tooltipOptions={{ position: "left" }}
                    className="mr-2 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleDismiss();
                    }}
                />
            )}
        </li>
    );
}
