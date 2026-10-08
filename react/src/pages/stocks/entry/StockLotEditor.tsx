import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { STOCK_UNIT_UNITS, type StockUnitUnits } from "@chocosous/shared";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import { getLocalExpiryState, STOCK_EXPIRY_DISPLAY } from "@/utils/stocks/stockExpiry";
import { EXPIRATION_SHORTCUTS, type StockLotDraft } from "./stockEntryDraft";

interface StockLotEditorProps {
    lot: StockLotDraft;
    index: number;
    locations: StockLocation[];
    onChange: (changes: Partial<StockLotDraft>) => void;
    onRemove: () => void;
}

/** Édition d'un lot : nombre d'exemplaires, contenu, lieu et péremption (facultative). */
export default function StockLotEditor({ lot, index, locations, onChange, onRemove }: StockLotEditorProps) {
    const id = `stock-lot-${lot.key}`;
    const existing = lot.unitIds.length > 0;
    const removed = existing && lot.copies === 0;
    const delta = lot.copies - lot.unitIds.length;
    const expiry = STOCK_EXPIRY_DISPLAY[getLocalExpiryState(lot.expirationDate)];

    if (removed) {
        return (
            <div role="group" aria-label={`Lot ${index + 1}`} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 p-3">
                <span className="line-through text-gray-500">
                    {lot.unitIds.length} × {lot.quantity} {lot.unit} — sera retiré du stock
                </span>
                <Button type="button" label="Annuler" text size="small" onClick={() => onChange({ copies: lot.unitIds.length })} />
            </div>
        );
    }

    return (
        <div role="group" aria-label={`Lot ${index + 1}`} className="flex flex-col gap-3 rounded-lg border border-gray-300 p-3">
            <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                    {existing ? `En stock : ${lot.unitIds.length} exemplaire(s)` : "Nouveau lot"}
                    {existing && delta !== 0 && (
                        <span className="ml-2 font-normal text-sm">({delta > 0 ? `+${delta}` : delta})</span>
                    )}
                </span>
                <Button type="button" icon="pi pi-trash" text rounded severity="danger"
                    aria-label={existing ? `Retirer le lot ${index + 1} du stock` : `Supprimer le lot ${index + 1}`}
                    tooltip={existing ? "Retirer du stock" : "Supprimer ce lot"} tooltipOptions={{ position: "left" }}
                    onClick={onRemove} />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${id}-copies`} className="text-sm">Exemplaires</label>
                    <InputNumber inputId={`${id}-copies`} value={lot.copies} min={existing ? 0 : 1} max={1000}
                        showButtons buttonLayout="horizontal" inputClassName="w-full text-center min-w-0"
                        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                        onValueChange={(event) => onChange({ copies: event.value ?? 0 })} />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${id}-quantity`} className="text-sm">Contenu</label>
                    <InputNumber inputId={`${id}-quantity`} value={lot.quantity} min={0} maxFractionDigits={3}
                        inputClassName="w-full min-w-0" placeholder="Quantité"
                        onValueChange={(event) => onChange({ quantity: event.value ?? null })} />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${id}-unit`} className="text-sm">Unité</label>
                    <Dropdown inputId={`${id}-unit`} value={lot.unit} options={[...STOCK_UNIT_UNITS]}
                        onChange={(event) => onChange({ unit: event.value as StockUnitUnits })} />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${id}-location`} className="text-sm">Lieu</label>
                    <Dropdown inputId={`${id}-location`} value={lot.locationId} options={locations}
                        optionLabel="label" optionValue="id" placeholder="Choisir"
                        onChange={(event) => onChange({ locationId: event.value as number })} />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-expiration`} className="text-sm">
                    Péremption <span className="text-gray-500">(facultative)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar inputId={`${id}-expiration`} value={lot.expirationDate} dateFormat="dd/mm/yy"
                        showIcon showButtonBar placeholder="Sans date" className="w-44"
                        touchUI={false}
                        onChange={(event) => onChange({ expirationDate: event.value instanceof Date ? event.value : null })} />
                    {EXPIRATION_SHORTCUTS.map((shortcut) => (
                        <Button key={shortcut.label} type="button" label={shortcut.label} size="small" outlined
                            onClick={() => onChange({ expirationDate: shortcut.apply(new Date()) })} />
                    ))}
                    {lot.expirationDate && expiry.severity && <Tag value={expiry.label} severity={expiry.severity} />}
                </div>
            </div>
        </div>
    );
}
