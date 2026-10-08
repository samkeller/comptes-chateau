import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import type { StockMovementDto } from "@chocosous/shared";
import StockDashboardService from "@/services/stocks/StockDashboardService";
import { formatDistanceToNow } from "@/utils/DatesUtils";
import StockMovementTypeTag from "../atoms/StockMovementTypeTag";

const dashboardService = new StockDashboardService();
const HISTORY_LIMIT = 50;

interface StockMovementsCardProps {
    /** Change à chaque modification du stock pour recharger l'historique. */
    refreshKey: number;
}

/** Historique des derniers mouvements (entrées, consommations, suppressions). */
export default function StockMovementsCard({ refreshKey }: StockMovementsCardProps) {
    const [movements, setMovements] = useState<StockMovementDto[] | null>(null);

    useEffect(() => {
        let active = true;
        dashboardService.getLastMovements(HISTORY_LIMIT)
            .then((data) => { if (active) setMovements(data); })
            .catch(() => { if (active) setMovements((current) => current ?? []); });
        return () => { active = false; };
    }, [refreshKey]);

    return (
        <Card title={<h2 className="m-0 text-xl">Historique</h2>}>
            <DataTable value={movements ?? []} dataKey="id" loading={movements === null} size="small"
                paginator rows={10} responsiveLayout="stack" breakpoint="768px"
                emptyMessage="Aucun mouvement de stock.">
                <Column header="Quand" style={{ width: "10rem" }}
                    body={(movement: StockMovementDto) => (
                        <span title={new Date(movement.createdAt).toLocaleString("fr-FR")}>
                            {formatDistanceToNow(new Date(movement.createdAt))}
                        </span>
                    )} />
                <Column field="itemLabel" header="Produit" />
                <Column header="Contenu" style={{ width: "8rem" }}
                    body={(movement: StockMovementDto) => `${movement.quantity} ${movement.unit}`} />
                <Column field="locationLabel" header="Lieu" />
                <Column header="Mouvement" style={{ width: "8rem" }}
                    body={(movement: StockMovementDto) => <StockMovementTypeTag type={movement.type} />} />
            </DataTable>
        </Card>
    );
}
