import StockUnitsService from "@/services/stocks/StockUnitsService";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { showGlobalToast } from "@/services/GlobalToast";

interface DeleteStockUnitButtonProps {
    unitLabel: string;
    unitId: number;
    afterDeleteUnit?: () => void;
}

const stockUnitsService = new StockUnitsService();

export default function DeleteStockUnitButton({ unitId, unitLabel, afterDeleteUnit }: DeleteStockUnitButtonProps) {
    const showConfirmDialog = () => {

        confirmDialog({
            message: `Voulez-vous vraiment supprimer "${unitLabel}" ?`,
            header: `Supprimer "${unitLabel}" ? Cela ne comptera pas comme si cela est coché.`,
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Supprimer",
            rejectLabel: "Annuler",
            acceptClassName: "p-button-danger",

            accept: () => {
                stockUnitsService.delete(unitId).then(() => {
                    showGlobalToast({ severity: "success", summary: "Unité de stock supprimée." });
                    afterDeleteUnit?.();
                })
            },
        });
    }

    return (
        <>
            <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                tooltip="Supprimer"
                onClick={() =>
                    showConfirmDialog()
                }
            />
        </>
    )
}
