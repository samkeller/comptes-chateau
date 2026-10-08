import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { STOCK_UNIT_UNITS, type StockUnitUnits } from "@chocosous/shared";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import Optional from "@/components/atoms/form/Optional";
import { getLocalExpiryState, STOCK_EXPIRY_DISPLAY } from "@/utils/stocks/stockExpiry";
import { type StockLotDraft } from "@/utils/stocks/stockEntryDraft";

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
            <div role="group" aria-label={`Lot ${index + 1}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-surface p-3">
                <span className="min-w-0 wrap-break-word line-through text-surface-500">
                    {lot.unitIds.length} × {lot.quantity} {lot.unit} — sera retiré du stock
                </span>
                <Button type="button" label="Annuler" icon="pi pi-undo" text size="small" onClick={() => onChange({ copies: lot.unitIds.length })} />
            </div>
        );
    }

    return (
        <div role="group" aria-label={`Lot ${index + 1}`} className="p-fluid flex min-w-0 flex-col gap-4 rounded-lg border border-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                    className={`min-w-0 text-sm font-semibold ${existing ? "text-primary" : "text-info"}`}
                >
                    {existing ? `En stock` : "Nouveau lot"}
                    {existing && delta !== 0 && (
                        <span className="ml-2 font-normal text-sm text-info">({delta > 0 ? `+${delta}` : delta})</span>
                    )}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    {lot.expirationDate && expiry.severity && <Tag value={expiry.label} severity={expiry.severity} />}
                    <Button type="button" icon="pi pi-trash" text rounded severity="danger"
                        aria-label={existing ? `Retirer le lot ${index + 1} du stock` : `Supprimer le lot ${index + 1}`}
                        tooltip={existing ? "Retirer du stock" : "Supprimer ce lot"} tooltipOptions={{ position: "left" }}
                        onClick={onRemove} />
                </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-7 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                <FloatLabel className="min-w-0">
                    <InputNumber inputId={`${id}-copies`} value={lot.copies} min={existing ? 0 : 1} max={1000}
                        showButtons inputClassName="w-full min-w-0"
                        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                        onValueChange={(event) => onChange({ copies: event.value ?? 0 })} />
                    <label htmlFor={`${id}-copies`}>Exemplaires</label>
                </FloatLabel>
                <FloatLabel className="min-w-0">
                    <InputNumber inputId={`${id}-quantity`} value={lot.quantity} min={0} maxFractionDigits={3}
                        inputClassName="w-full min-w-0"
                        onValueChange={(event) => onChange({ quantity: event.value ?? null })} />
                    <label htmlFor={`${id}-quantity`}>Contenu</label>
                </FloatLabel>
                <FloatLabel className="min-w-0">
                    <Dropdown inputId={`${id}-unit`} value={lot.unit} options={[...STOCK_UNIT_UNITS]}
                        onChange={(event) => onChange({ unit: event.value as StockUnitUnits })} />
                    <label htmlFor={`${id}-unit`}>Unité</label>
                </FloatLabel>
                <FloatLabel className="min-w-0">
                    <Dropdown inputId={`${id}-location`} value={lot.locationId} options={locations}
                        optionLabel="label" optionValue="id"
                        onChange={(event) => onChange({ locationId: event.value as number })} />
                    <label htmlFor={`${id}-location`}>Lieu</label>
                </FloatLabel>
                <FloatLabel className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <Calendar
                        inputId={`${id}-expiration`}
                        value={lot.expirationDate}
                        dateFormat="dd/mm/yy"
                        showIcon
                        showButtonBar
                        inputClassName="min-w-0"
                        onChange={(event) => onChange({ expirationDate: event.value instanceof Date ? event.value : null })}
                    />
                    <label htmlFor={`${id}-expiration`}>Péremption<Optional /></label>
                </FloatLabel>
            </div>
        </div>
    );
}
