import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import StockLocation from "@/interfaces/stocks/StockLocation";

interface StockLocationDialogProps {
    visible: boolean;
    location?: StockLocation | null;
    onHide: () => void;
    onSubmit: (payload: { label: string }) => Promise<void>;
}

export default function StockLocationDialog({
    visible,
    location,
    onHide,
    onSubmit,
}: StockLocationDialogProps) {
    const [label, setLabel] = useState(() => location?.label ?? "");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await onSubmit({ label });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            visible={visible}
            header={location ? "Modifier un lieu" : "Ajouter un lieu"}
            onHide={onHide}
            style={{ width: "min(32rem, 95vw)" }}
            footer={(
                <div>
                    <Button label="Annuler" text onClick={onHide} />
                    <Button label={location ? "Enregistrer" : "Créer"} onClick={() => void handleSubmit()} loading={saving} />
                </div>
            )}
        >
            <div className="pt-6">
                <FloatLabel>
                    <InputText
                        id="stock-location-label"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        className="w-full"
                        autoFocus
                    />
                    <label htmlFor="stock-location-label">Nom du lieu</label>
                </FloatLabel>
            </div>
        </Dialog>
    );
}
