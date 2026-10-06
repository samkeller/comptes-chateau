import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";
import { Card } from "primereact/card";
import { ScrollPanel } from "primereact/scrollpanel";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import { useEffect, useState } from "react";
const stockDashboardService = new StockDashboardService();

export default function StockExpiringItemsList() {
    const [expiringItems, setExpiringItems] = useState<StockUnit[]>([]);

    useEffect(() => {
        stockDashboardService.getExpiringItems().then(setExpiringItems);
    }, []);

    /**
    * Lie une distance de date avec une sévérité PrimeReact
    * - Périmé = error
    * - <= 1 mois = warning
    * - > 1 mois = info
    */
    const severityClass = (expirationDate: Date) => {
        const now = new Date();
        const diffInDays = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffInDays <= 0) return "text-error"; // Périmé
        if (diffInDays <= 30) return "text-warn"; // 1 mois
        return "text-info"; // + 1 mois
    };

    return (
        <Card title="Expire bientôt">
            {expiringItems.length === 0 ? (
                <div className="text-500">
                    Aucun article n'expire bientôt.
                </div>
            ) : (
                <ScrollPanel style={{ width: "100%", height: "150px" }}>
                    <ul className="list-none p-0 m-0">
                        {expiringItems.map((item) => {
                            const date = item.expirationDate!;
                            const severity = severityClass(date);
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
                                        <div className={`${severity} text-sm font-medium`}>
                                            {parseDateToDisplay(date)}
                                        </div>

                                        <div className={`${severity} text-xs mt-1`}>
                                            {formatDistanceToNow(date)}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </ScrollPanel>
            )}
        </Card>
    );
}