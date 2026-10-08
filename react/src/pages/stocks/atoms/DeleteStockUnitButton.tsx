import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { showGlobalToast } from "@/services/GlobalToast";
import StockUnitsService from "@/services/stocks/StockUnitsService";

interface DeleteStockUnitButtonProps {
    itemLabel: string;
    unitId: number;
    afterDeleteUnit?: () => void;
}

const stockUnitsService = new StockUnitsService();

/** Retire un exemplaire saisi par erreur (mouvement `DELETE`, pas une consommation). */
export default function DeleteStockUnitButton({ itemLabel, unitId, afterDeleteUnit }: DeleteStockUnitButtonProps) {

    function requestDeleteUnit(): void {
        confirmDialog({
            header: "Supprimer un exemplaire",
            message: `Supprimer un exemplaire de « ${itemLabel} » saisi par erreur ? Pour un produit consommé, utilise plutôt « Prendre ».`,
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Supprimer",
            rejectLabel: "Annuler",
            acceptClassName: "p-button-danger",
            accept: () => {
                stockUnitsService.delete(unitId)
                    .then(() => {
                        showGlobalToast({ severity: "success", summary: "Exemplaire supprimé" });
                        afterDeleteUnit?.();
                    })
                    .catch(() => undefined);
            },
        });
    }

    return (
        <Button
            icon="pi pi-trash"
            severity="danger"
            onClick={requestDeleteUnit}
            rounded text
            aria-label={`Supprimer un exemplaire (erreur de saisie) : ${itemLabel}`}
            tooltip="Supprimer un exemplaire (erreur de saisie)"
            tooltipOptions={{ position: "top" }}
        />
    );
}
