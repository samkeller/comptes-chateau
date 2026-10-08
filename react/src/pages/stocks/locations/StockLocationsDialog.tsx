import { useState } from "react";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { useGlobalToast } from "@/context/GlobalToastContext";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockLocationDialog from "./StockLocationDialog";

const locationService = new StockLocationService();

interface StockLocationsDialogProps {
    locations: StockLocation[];
    confirmGroup: string;
    onClose: () => void;
    onChanged: () => void;
}

/** Gestion des lieux de stockage (ajout, renommage, suppression). */
export default function StockLocationsDialog({ locations, confirmGroup, onClose, onChanged }: StockLocationsDialogProps) {
    const showToast = useGlobalToast();
    const [editing, setEditing] = useState<StockLocation | "new" | null>(null);

    const submit = async ({ label }: { label: string }): Promise<void> => {
        if (editing === "new") {
            await locationService.createLocation({ label });
            showToast({ severity: "success", summary: "Lieu créé" });
        } else if (editing) {
            await locationService.updateLocation(editing.id, { label });
            showToast({ severity: "success", summary: "Lieu renommé" });
        }
        setEditing(null);
        onChanged();
    };

    const requestDelete = (location: StockLocation): void => {
        confirmDialog({
            group: confirmGroup,
            header: "Supprimer le lieu",
            message: `Supprimer le lieu « ${location.label} » ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                locationService.deleteLocation(location.id)
                    .then(() => {
                        showToast({ severity: "success", summary: "Lieu supprimé" });
                        onChanged();
                    })
                    // Erreur (lieu non vide…) affichée par l'intercepteur.
                    .catch(() => undefined);
            },
        });
    };

    return (
        <Dialog visible onHide={onClose} header="Lieux de stockage" style={{ width: "min(32rem, 95vw)" }}>
            {editing && (
                <StockLocationDialog visible location={editing === "new" ? null : editing}
                    onHide={() => setEditing(null)} onSubmit={submit} />
            )}
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {locations.map((location) => (
                    <li key={location.id} className="flex items-center gap-2 border-b border-gray-200 py-1">
                        <span className="flex-1 min-w-0 truncate">{location.label}</span>
                        <span className="text-sm text-gray-500">{location.stockUnitCount} exemplaire(s)</span>
                        <Button icon="pi pi-pencil" rounded text aria-label={`Renommer ${location.label}`}
                            onClick={() => setEditing(location)} />
                        <Button icon="pi pi-trash" rounded text severity="danger" aria-label={`Supprimer ${location.label}`}
                            onClick={() => requestDelete(location)} />
                    </li>
                ))}
                {locations.length === 0 && <li className="text-gray-500">Aucun lieu pour le moment.</li>}
            </ul>
            <Button className="mt-3" icon="pi pi-plus" label="Ajouter un lieu" onClick={() => setEditing("new")} />
        </Dialog>
    );
}
