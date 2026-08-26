import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { format, parseISO } from "date-fns";
import StockItem from "@/interfaces/stocks/StockItem";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { SaveStockItemDto } from "@/services/stocks/dto/SaveStockItemDto";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import RequiredMark from "@/components/atoms/form/RequiredMark";
import Optional from "@/components/atoms/form/Optional";

interface StockItemDialogProps {
    visible: boolean;
    item?: StockItem | null;
    locations: StockLocation[];
    selectedLocationId: number | null;
    onHide: () => void;
    onSubmit: (payload: SaveStockItemDto) => Promise<void>;
}

export default function StockItemDialog({
    visible,
    item,
    locations,
    selectedLocationId,
    onHide,
    onSubmit,
}: StockItemDialogProps) {
    const [label, setLabel] = useState(() => item?.label ?? "");
    const [barcode, setBarcode] = useState(() => item?.barcode ?? "");
    const [unit, setUnit] = useState(() => item?.unit ?? "");
    const [locationId, setLocationId] = useState<number | null>(() => item?.locationId ?? selectedLocationId);
    const [expirationDate, setExpirationDate] = useState<Date | null>(() => item?.expirationDate ? parseISO(item.expirationDate) : null);
    const [imageUrl, setImageUrl] = useState(() => item?.imageUrl ?? "");
    const [initialQuantity, setInitialQuantity] = useState(0);
    const [saving, setSaving] = useState(false);

    const stockUnitsAutocompleteSuggestions = ["kg", "g", "L", "mL", "Unité", "Bouteille", "Carton", "Sachet", "Boîte", "Paquet", "Pièce"];
    const [filteredUnits, setFilteredUnits] = useState<string[]>([]);

    const isFormValid = label.trim().length > 0 && unit.trim().length > 0 && locationId !== null;

    const handleSubmit = async () => {
        if (!isFormValid || !locationId) {
            return;
        }

        const payload: SaveStockItemDto = {
            label,
            barcode: barcode || null,
            unit,
            locationId,
            expirationDate: expirationDate ? format(expirationDate, "yyyy-MM-dd") : null,
            imageUrl: imageUrl || null,
            ...(item ? {} : { initialQuantity, occurredAt: new Date(), source: "manual" }),
        };

        setSaving(true);
        try {
            await onSubmit(payload);
        } finally {
            setSaving(false);
        }
    };

    const searchUnits = (event: AutoCompleteCompleteEvent) => {
        const query = event.query.toLowerCase();
        const filtered = stockUnitsAutocompleteSuggestions.filter((unit) => unit.toLowerCase().includes(query));
        setFilteredUnits(filtered);
    }

    return (
        <Dialog
            visible={visible}
            header={item ? "Modifier un produit" : "Ajouter un produit"}
            onHide={onHide}
            style={{ width: "min(40rem, 95vw)" }}
            footer={(
                <div>
                    <Button label="Annuler" text onClick={onHide} />
                    <Button label={item ? "Enregistrer" : "Créer"} onClick={() => void handleSubmit()} loading={saving} disabled={!isFormValid} />
                </div>
            )}
        >
            <div className="flex flex-col gap-6 pt-6">
                <FloatLabel>
                    <InputText id="stock-item-label" value={label} onChange={(event) => setLabel(event.target.value)} className="w-full" autoFocus />
                    <label htmlFor="stock-item-label">Nom du produit<RequiredMark /></label>
                </FloatLabel>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FloatLabel>
                        <InputText id="stock-item-barcode" value={barcode} onChange={(event) => setBarcode(event.target.value)} className="w-full" />
                        <label htmlFor="stock-item-barcode">Code-barres <small>(optionnel)</small></label>
                    </FloatLabel>

                    <FloatLabel>
                        <AutoComplete
                            id="stock-item-unit"
                            value={unit}
                            suggestions={filteredUnits}
                            onChange={(event) => setUnit(event.value)}
                            completeMethod={searchUnits}
                            className="w-full"
                        />
                        <label htmlFor="stock-item-unit">Unité<RequiredMark /></label>
                    </FloatLabel>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FloatLabel>
                        <Dropdown
                            id="stock-item-location"
                            value={locationId}
                            options={locations.map((location) => ({ label: location.label, value: location.id }))}
                            onChange={(event) => setLocationId(event.value as number | null)}
                            className="w-full"
                        />
                        <label htmlFor="stock-item-location">Lieu<RequiredMark /></label>
                    </FloatLabel>

                    <FloatLabel>
                        <Calendar
                            id="stock-item-expiration"
                            value={expirationDate}
                            onChange={(event) => setExpirationDate(event.value ?? null)}
                            dateFormat="dd/mm/yy"
                            className="w-full"
                            showIcon
                        />
                        <label htmlFor="stock-item-expiration">Date de péremption <Optional /></label>
                    </FloatLabel>
                </div>

                <FloatLabel>
                    <InputText id="stock-item-image" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="w-full" />
                    <label htmlFor="stock-item-image">Image (URL ou chemin) <Optional /></label>
                </FloatLabel>

                {!item && (
                    <FloatLabel>
                        <InputNumber
                            id="stock-item-initial-quantity"
                            value={initialQuantity}
                            onValueChange={(event) => setInitialQuantity(event.value ?? 0)}
                            className="w-full"
                            min={0}
                            minFractionDigits={0}
                            maxFractionDigits={2}
                        />
                        <label htmlFor="stock-item-initial-quantity">Quantité initiale</label>
                    </FloatLabel>
                )}
            </div>
        </Dialog>
    );
}
