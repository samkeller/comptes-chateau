import type { ReactNode } from "react";
import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";
import { getStockSeverity } from "@/utils/stocks/StockSeverity";
import { Tooltip } from "primereact/tooltip";

interface StockExpirationDateProps {
    date: Date;
    showDistance?: boolean;
    children?: ReactNode;
}

export default function StockExpirationDate({ date, showDistance = false, children }: StockExpirationDateProps) {
    const severity = getStockSeverity(date);
    const alertLabel = severity === "error" ? "Périmé" : "À échéance proche";

    return (
        <>
            <Tooltip target={`#stock-expiration-alert-${date.getTime()}`} />
            <span className="inline-flex items-center gap-2">
                {severity && (
                    <i
                        id={`stock-expiration-alert-${date.getTime()}`}
                        className={`pi ${severity === "error"
                            ? "pi-exclamation-triangle text-error"
                            : "pi-exclamation-circle text-warn"}`
                        }
                        role="img"
                        aria-label={alertLabel}
                        data-pr-tooltip={alertLabel}
                    />
                )}
                <span>
                    <span className="block">{children ?? parseDateToDisplay(date)}</span>
                    {showDistance && <span className="block text-xs mt-1">{formatDistanceToNow(date)}</span>}
                </span>
            </span>
        </>

    );
}