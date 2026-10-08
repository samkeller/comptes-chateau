import { useEffect, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import { formatDistanceToNow, parseDateToDisplay } from "@/utils/DatesUtils";
import StockMovementTypeTag from "../atoms/StockMovementTypeTag";
import StockMovement from "@/interfaces/stocks/StockMovement";

const dashboardService = new StockDashboardService();
const HISTORY_LIMIT = 50;

interface StockMovementsCardProps {
    /** Change à chaque modification du stock pour recharger l'historique. */
    refreshKey: number;
    onClose: () => void;
}

/** Historique des derniers mouvements (entrées, consommations, suppressions). */
export default function StockMovementsDialog({ refreshKey, onClose }: StockMovementsCardProps) {
    const [movements, setMovements] = useState<StockMovement[]>([]);

    useEffect(() => {
        dashboardService.getLastMovements(HISTORY_LIMIT).then(setMovements);
    }, [refreshKey]);

    return (
        <Dialog visible onHide={onClose} header="Historique" style={{ width: "min(32rem, 95vw)" }}>
            <DataTable
                value={movements}
                dataKey="id"
                loading={movements.length === 0}
                size="small"
                paginator rows={10}
                breakpoint="768px"
                emptyMessage="Aucun mouvement de stock."
            >
                <Column
                    header="Quand"
                    style={{ width: "10rem" }}
                    body={(movement: StockMovement) => (
                        <div className="flex flex-col gap-1">
                            <span>{formatDistanceToNow(movement.createdAt)}</span>
                            <span className="text-sm text-gray-500">{parseDateToDisplay(movement.createdAt)}</span>
                        </div>
                    )} />
                <Column
                    field="itemLabel"
                    header="Produit"
                />
                <Column
                    header="Contenu"
                    style={{ width: "8rem" }}
                    body={(movement: StockMovement) => `${movement.quantity} ${movement.unit}`}
                />
                <Column
                    field="locationLabel"
                    header="Lieu"
                />
                <Column
                    header="Mouvement"
                    style={{ width: "8rem" }}
                    body={(movement: StockMovement) => <StockMovementTypeTag type={movement.type} />}
                />
            </DataTable>
        </Dialog>
    );
}
