import StockDetailsCard from "./StockDetailsCard";
import { ScrollPanel } from "primereact/scrollpanel";
import { Tag } from "primereact/tag";
import { useEffect, useState } from "react";
import type { StockMovementDto, StockMovementType } from "@chocosous/shared";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";

const stockDashboardService = new StockDashboardService();
const movementLabels: Record<StockMovementType, string> = {
    IN: "Entrée",
    OUT: "Sortie",
    DELETE: "Suppression",
};
const movementSeverities: Record<StockMovementType, "success" | "info" | "danger"> = {
    IN: "success",
    OUT: "info",
    DELETE: "danger",
};

export default function LastStockMovements() {
    const [movements, setMovements] = useState<StockMovementDto[]>([]);

    useEffect(() => {
        let active = true;
        stockDashboardService.getLastMovements()
            .then((data) => {
                if (active) setMovements(data);
            });
        return () => { active = false; };
    }, []);

    return (
        <StockDetailsCard
            title="Derniers mouvements"
            hasDetails={movements.length > 0}
            summary={movements.length === 0 ? (
                <div className="text-500">Aucun mouvement de stock.</div>
            ) : (
                <>
                    <dl className="grid grid-cols-3 gap-4 m-0">
                        {(["IN", "OUT"] as const).map((type) => (
                            <div key={type}>
                                <dt className="text-500 text-sm">{movementLabels[type] + `${movements.filter((movement) => movement.type === type).length > 1 ? "s" : ""}`}</dt>
                                <dd className="text-2xl font-semibold m-0">
                                    {movements.filter((movement) => movement.type === type).length}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </>
            )}
        >
            <ScrollPanel style={{ width: "100%", height: "150px" }}>
                <ul className="list-none p-0 m-0">
                    {movements.map((movement) => {
                        const date = new Date(movement.createdAt);
                        return (
                            <li key={movement.id} className="flex items-center gap-3 py-3 pr-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{movement.itemLabel} - {movement.quantity} {movement.unit}</div>
                                    <div className="text-500 text-sm mt-1">
                                        <i className="pi pi-map-marker mr-1 text-xs" aria-hidden="true" />
                                        {movement.locationLabel}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <Tag value={movementLabels[movement.type]} severity={movementSeverities[movement.type]} />
                                    <div className="text-500 text-sm mt-1">{parseDateToDisplay(date)}</div>
                                    <div className="text-500 text-xs mt-1">{formatDistanceToNow(date)}</div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </ScrollPanel>
        </StockDetailsCard>
    );
}