import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";
import StockDetailsCard from "./StockDetailsCard";
import { useMemo } from "react";
import { ScrollPanel } from "primereact/scrollpanel";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import { useEffect, useState } from "react";
const stockDashboardService = new StockDashboardService();

export default function StockExpiringItemsList() {
    const [expiringItems, setExpiringItems] = useState<StockUnit[]>([]);

    useEffect(() => {
        stockDashboardService.getExpiringItems().then((data) => setExpiringItems(data));
    }, []);

    const expiringItemBySeverity = useMemo(() => {
        const bySeverity: Record<string, StockUnit[]> = {
            "error": [],
            "warn": [],
        };

        expiringItems
            .filter(e => e.severity !== null && e.severity !== "info") // Uniquement les éléments avec une sévérité "error" ou "warn"
            .forEach(element => {
                bySeverity[element.severity!].push(element);
            });
        return bySeverity;

    }, [expiringItems]);

    const severityLabels: Record<string, string> = {
        error: "Périmés",
        warn: "À échéance proche",
    };

    return (
        <StockDetailsCard
            title="Prochaines échéances"
            hasDetails={expiringItems.length > 0}
            summary={(
                <div className="flex gap-4 align-middle justify-between">
                    {
                        Object.entries(expiringItemBySeverity).map(([severity, items]) => (
                            <div key={severity} className="flex flex-col">
                                <dt className={`text-500 text-sm`}>{`${severityLabels[severity]}`}</dt>
                                <dd className={`text-2xl font-semibold m-0 text-${severity}`}>{items.length}</dd>
                            </div>
                        ))
                    }
                </div>
            )}
        >
            <ScrollPanel style={{ width: "100%", height: "150px" }}>
                <ul className="list-none p-0 m-0">
                    {expiringItems.map((item) => {
                        const date = item.expirationDate!;
                        return (
                            <li
                                key={item.id}
                                className="flex align-items-center gap-3 py-3 pr-2 border-bottom-1 surface-border"
                            >
                                {/* Article + localisation */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-900 truncate">
                                        {item.item.label}
                                    </div>

                                    <div className="text-500 text-sm mt-1">
                                        <i className="pi pi-map-marker mr-1 text-xs" />
                                        {item.location.label}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="text-right shrink-0">
                                    <div className={`text-${item.severity} text-sm font-medium`}>
                                        {parseDateToDisplay(date)}
                                    </div>

                                    <div className={`text-${item.severity} text-xs mt-1`}>
                                        {formatDistanceToNow(date)}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </ScrollPanel>
        </StockDetailsCard>
    );
}