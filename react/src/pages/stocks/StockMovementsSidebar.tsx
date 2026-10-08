import { useEffect, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Sidebar } from "primereact/sidebar";
import { Tag } from "primereact/tag";
import type { StockMovementDto, StockMovementType } from "@chocosous/shared";
import { useScreen } from "@/hooks/useScreen";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import { formatDistanceToNow } from "@/utils/DatesUtils";

const dashboardService = new StockDashboardService();
const HISTORY_LIMIT = 50;

const STOCK_MOVEMENT_DISPLAY: Record<StockMovementType, { label: string; severity: "success" | "info" | "danger" | "secondary" }> = {
    IN: { label: "Entrée", severity: "success" },
    OUT: { label: "Consommé", severity: "info" },
    DELETE: { label: "Supprimé", severity: "danger" },
    ADJUST: { label: "Corrigé", severity: "secondary" },
};

interface StockMovementsSidebarProps {
    visible: boolean;
    onHide: () => void;
}

/** Historique des derniers mouvements, hors du chemin principal d'ajout / prise. */
export default function StockMovementsSidebar({ visible, onHide }: StockMovementsSidebarProps) {
    const { isMobile } = useScreen();
    const [movements, setMovements] = useState<StockMovementDto[] | null>(null);

    useEffect(() => {
        if (!visible) return;
        let active = true;
        dashboardService.getLastMovements(HISTORY_LIMIT)
            .then((data) => { if (active) setMovements(data); })
            .catch(() => { if (active) setMovements([]); });
        return () => {
            active = false;
            setMovements(null);
        };
    }, [visible]);

    return (
        <Sidebar visible={visible} onHide={onHide} position={isMobile ? "bottom" : "right"}
            className={isMobile ? "h-[80vh]" : "w-[28rem]"} header={<h2 className="m-0 text-lg font-semibold">Historique</h2>}>
            {movements === null ? (
                <div className="flex justify-center p-8"><ProgressSpinner /></div>
            ) : movements.length === 0 ? (
                <p className="text-gray-500">Aucun mouvement de stock.</p>
            ) : (
                <ul className="m-0 list-none p-0">
                    {movements.map((movement) => (
                        <li key={movement.id} className="flex items-center gap-3 border-b border-gray-200 py-2">
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">{movement.itemLabel} · {movement.quantity} {movement.unit}</div>
                                <div className="text-sm text-gray-500">
                                    <i className="pi pi-map-marker mr-1 text-xs" aria-hidden="true" />{movement.locationLabel}
                                    {" · "}{formatDistanceToNow(new Date(movement.createdAt))}
                                </div>
                            </div>
                            <Tag value={STOCK_MOVEMENT_DISPLAY[movement.type].label} severity={STOCK_MOVEMENT_DISPLAY[movement.type].severity} />
                        </li>
                    ))}
                </ul>
            )}
        </Sidebar>
    );
}
