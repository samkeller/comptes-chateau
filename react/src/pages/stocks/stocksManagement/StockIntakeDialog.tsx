import { useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { formatApiDate } from "@/utils/DatesUtils";
import { StockIntakeDto } from "@/services/stocks/dto/StockIntakeDto";

interface StockIntakeDialogProps {
    visible: boolean;
    locationId: number;
    onHide: () => void;
    onSubmit: (payload: StockIntakeDto) => Promise<void>;
}

export default function StockIntakeDialog({ visible, locationId, onHide, onSubmit }: StockIntakeDialogProps) {
    const [label, setLabel] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState("unite");
    const [expirationDate, setExpirationDate] = useState<Date | null>(null);
    const [saving, setSaving] = useState(false);

    const isFormValid = label.trim().length > 0 && unit.trim().length > 0 && quantity > 0;

    async function handleSubmit(): Promise<void> {
        if (!isFormValid) {
            return;
        }

        setSaving(true);
        try {
            await onSubmit({
                locationId,
                source: "manual",
                occurredAt: new Date(),
                lines: [{
                    label,
                    quantity,
                    unit,
                    expirationDate: expirationDate ? formatApiDate(expirationDate) : null,
                }],
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog
            visible={visible}
            header="Ajouter au stock"
            onHide={onHide}
            style={{ width: "min(34rem, 95vw)" }}
            footer={(
                <div>
                    <Button label="Annuler" text onClick={onHide} />
                    <Button label="Ajouter" icon="pi pi-check" onClick={() => void handleSubmit()} loading={saving} disabled={!isFormValid} />
                </div>
            )}
        >
            <div className="flex flex-col gap-4 pt-2">
                <InputText value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Produit" autoFocus />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InputNumber value={quantity} onValueChange={(event) => setQuantity(event.value ?? 1)} min={0.01} maxFractionDigits={2} placeholder="Quantite" />
                    <InputText value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Unite" />
                </div>
                <Calendar value={expirationDate} onChange={(event) => setExpirationDate(event.value ?? null)} dateFormat="dd/mm/yy" placeholder="Peremption optionnelle" showIcon />
            </div>
        </Dialog>
    );
}
