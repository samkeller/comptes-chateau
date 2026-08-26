import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import StockItem from "@/interfaces/stocks/StockItem";
import { RecordStockMovementDto } from "@/services/stocks/dto/RecordStockMovementDto";
import { StockMovementType } from "@/interfaces/stocks/StockMovement";
import RequiredMark from "@/components/atoms/form/RequiredMark";

interface StockMovementDialogProps {
    visible: boolean;
    item: StockItem | null;
    onHide: () => void;
    onSubmit: (payload: RecordStockMovementDto) => Promise<void>;
}

export default function StockMovementDialog({
    visible,
    item,
    onHide,
    onSubmit,
}: StockMovementDialogProps) {
    const [type, setType] = useState<StockMovementType>(() => "IN");
    const [quantity, setQuantity] = useState(() => 1);
    const [occurredAt, setOccurredAt] = useState<Date>(() => new Date());
    const [saving, setSaving] = useState(false);
    const isFormValid = quantity > 0;

    const handleSubmit = async () => {
        if (!isFormValid) {
            return;
        }

        setSaving(true);
        try {
            await onSubmit({
                type,
                quantity,
                occurredAt,
                source: "manual",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            visible={visible}
            header={item ? `Ajuster : ${item.label}` : "Ajuster le stock"}
            onHide={onHide}
            style={{ width: "min(34rem, 95vw)" }}
            footer={(
                <div>
                    <Button label="Annuler" text onClick={onHide} />
                    <Button label="Enregistrer" onClick={() => void handleSubmit()} loading={saving} disabled={!isFormValid} />
                </div>
            )}
        >
            <div className="flex flex-col gap-6 pt-6">
                <FloatLabel>
                    <Dropdown
                        id="stock-movement-type"
                        value={type}
                        options={[
                            { label: "Entrée", value: "IN" },
                            { label: "Sortie", value: "OUT" },
                        ]}
                        onChange={(event) => setType(event.value as StockMovementType)}
                        className="w-full"
                    />
                    <label htmlFor="stock-movement-type">Type de mouvement<RequiredMark /></label>
                </FloatLabel>

                <FloatLabel>
                    <InputNumber
                        id="stock-movement-quantity"
                        value={quantity}
                        onValueChange={(event) => setQuantity(event.value ?? 0)}
                        className="w-full"
                        min={0.01}
                        minFractionDigits={0}
                        maxFractionDigits={2}
                    />
                    <label htmlFor="stock-movement-quantity">Quantité<RequiredMark /></label>
                </FloatLabel>

                <FloatLabel>
                    <Calendar
                        id="stock-movement-date"
                        value={occurredAt}
                        onChange={(event) => setOccurredAt(event.value ?? new Date())}
                        className="w-full"
                        dateFormat="dd/mm/yy"
                        showIcon
                        showTime
                    />
                    <label htmlFor="stock-movement-date">Date du mouvement</label>
                </FloatLabel>
            </div>
        </Dialog>
    );
}
