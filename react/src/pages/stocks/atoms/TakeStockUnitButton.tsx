import { showGlobalToast } from "@/services/GlobalToast";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";

interface TakeStockUnitButtonProps {
    unitLabel: string;
    unitId: number;
    afterTakeUnit?: () => void;
}

const stockUnitsService = new StockUnitsService();

export default function TakeStockUnitButton({ unitId, unitLabel, afterTakeUnit }: TakeStockUnitButtonProps) {

    function requestTakeUnit(): void {
        confirmDialog({
            header: "Prendre ce produit",
            message: `Marquer "${unitLabel}" comme pris ?`,
            icon: "pi pi-check-circle",
            acceptLabel: "Prendre",
            rejectLabel: "Annuler",
            accept: () => {
                stockUnitsService.takeUnit(unitId)
                    .then(() => {
                        showGlobalToast({ severity: "success", summary: "C'est juste coché en fait" });
                        afterTakeUnit?.();
                    })
                    .catch(() => {
                        showGlobalToast({ severity: "error", summary: "Action impossible" });
                    });
            },
        });
    }

    return (
        <Button
            icon="pi pi-cart-arrow-down"
            onClick={requestTakeUnit}
            rounded text
            tooltip="Prendre"
            tooltipOptions={{ position: "top" }}
        />
    );
}