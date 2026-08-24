import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { format, parseISO } from "date-fns";
import StockItem from "@/interfaces/stocks/StockItem";
import StockMovement from "@/interfaces/stocks/StockMovement";
import StockService from "@/services/stocks/StockService";

interface StockHistoryDialogProps {
    visible: boolean;
    item: StockItem | null;
    onHide: () => void;
}

const stockService = new StockService();

export default function StockHistoryDialog({
    visible,
    item,
    onHide,
}: StockHistoryDialogProps) {
    const [loading, setLoading] = useState(false);
    const [movements, setMovements] = useState<StockMovement[]>([]);

    useEffect(() => {
        if (!visible || !item) {
            setMovements([]);
            return;
        }

        setLoading(true);
        stockService.getItemHistory(item.id)
            .then(setMovements)
            .finally(() => setLoading(false));
    }, [visible, item]);

    return (
        <Dialog
            visible={visible}
            header={item ? `Historique : ${item.label}` : "Historique"}
            onHide={onHide}
            style={{ width: "min(48rem, 98vw)" }}
        >
            {loading ? (
                <div className="flex justify-center p-10">
                    <ProgressSpinner />
                </div>
            ) : (
                <DataTable value={movements} size="small" emptyMessage="Aucun mouvement">
                    <Column
                        header="Date"
                        body={(movement: StockMovement) => format(parseISO(movement.occurredAt), "dd/MM/yyyy HH:mm")}
                    />
                    <Column
                        header="Type"
                        body={(movement: StockMovement) => movement.type === "IN" ? "Entrée" : "Sortie"}
                    />
                    <Column
                        header="Quantité"
                        body={(movement: StockMovement) => `${movement.type === "IN" ? "+" : "-"}${movement.quantity}`}
                    />
                    <Column field="source" header="Source" />
                </DataTable>
            )}
        </Dialog>
    );
}
