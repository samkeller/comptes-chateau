import { Button } from "primereact/button";
import { Card } from "primereact/card";
import type { StockItemWithLotsDto, StockLotDto } from "@chocosous/shared";
import TakeStockUnitButton from "../atoms/TakeStockUnitButton";
import StockExpiryDateTag from "../atoms/StockExpiryDateTag";

interface StockItemCardProps {
    item: StockItemWithLotsDto;
    busy: boolean;
    onEdit: () => void;
    onAdd: () => void;
    onTake: (lot: StockLotDto) => void;
    onDuplicate: (lot: StockLotDto) => void;
    onDelete: (lot: StockLotDto) => void;
}



/** Un produit et ses lots : cocher, dupliquer ou supprimer un exemplaire en un clic. */
export default function StockItemCard({ item, busy, onEdit, onAdd, onDuplicate, onDelete }: StockItemCardProps) {
    return (
        <Card className="light" pt={{ body: { className: "p-3" }, content: { className: "p-0" } }}>
            <div className="flex items-start gap-3">
                {item.imageUrl && (
                    <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy"
                        className="h-12 w-12 shrink-0 rounded object-contain" />
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="m-0 truncate text-base font-semibold">{item.label}</h3>
                    <div className="truncate text-sm text-gray-500">
                        {item.brand && <span>{item.brand} · </span>}
                        {item.stockUnitsCount > 0 ? `${item.stockUnitsCount} en stock` : "Épuisé"}
                    </div>
                </div>
                <div className="flex shrink-0 gap-1">
                    <Button icon="pi pi-plus" rounded text aria-label={`Ajouter du stock : ${item.label}`}
                        tooltip="Ajouter" tooltipOptions={{ position: "top" }} onClick={onAdd} disabled={busy} />
                    <Button icon="pi pi-pencil" rounded text severity="secondary" aria-label={`Modifier ${item.label}`}
                        tooltip="Modifier" tooltipOptions={{ position: "top" }} onClick={onEdit} disabled={busy} />
                </div>
            </div>
            {item.lots.length > 0 && (
                <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                    {item.lots.map((lot) => (
                        <li key={lot.unitIds[0]} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 pt-1">
                            <span className="font-semibold">{lot.unitIds.length} ×</span>
                            <span>{lot.quantity} {lot.unit}</span>
                            <span className="text-sm text-gray-500">
                                <i className="pi pi-map-marker mr-1 text-xs" aria-hidden="true" />{lot.locationLabel}
                            </span>
                            <StockExpiryDateTag lot={lot} />
                            <span className="ml-auto flex gap-1">
                                <TakeStockUnitButton unitId={lot.unitIds[0]} unitLabel={lot.unit} />
                                <Button
                                    icon="pi pi-clone"
                                    size="small"
                                    rounded text
                                    disabled={busy}
                                    aria-label={`Ajouter un exemplaire identique : ${item.label}`}
                                    tooltip="Ajouter un exemplaire identique" tooltipOptions={{ position: "top" }}
                                    onClick={() => onDuplicate(lot)}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    size="small"
                                    rounded text
                                    severity="danger"
                                    disabled={busy}
                                    aria-label={`Supprimer un exemplaire (erreur de saisie) : ${item.label}`}
                                    tooltip="Supprimer un exemplaire (erreur de saisie)" tooltipOptions={{ position: "top" }}
                                    onClick={() => onDelete(lot)}
                                />
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
