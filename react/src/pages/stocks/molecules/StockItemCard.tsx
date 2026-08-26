import { format, parseISO } from "date-fns";
import { Button } from "primereact/button";
import StockItem from "@/interfaces/stocks/StockItem";
import StockQuantityLabel from "@/pages/stocks/atoms/StockQuantityLabel";

interface StockItemCardProps {
    item: StockItem;
    onShowHistory: (item: StockItem) => void;
    onEdit: (item: StockItem) => void;
    onAdjust: (item: StockItem) => void;
    onDelete: (item: StockItem) => void;
    onQuickMovement: (item: StockItem, type: "IN" | "OUT") => void;
}

export default function StockItemCard({
    item,
    onShowHistory,
    onEdit,
    onAdjust,
    onDelete,
    onQuickMovement,
}: StockItemCardProps) {
    return (
        <div className="rounded-xl border border-surface-200 p-4 shadow-sm">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold">{item.label}</div>
                        <StockQuantityLabel quantity={item.currentQuantity} unit={item.unit} className="text-sm text-surface-500" />
                    </div>
                    <div className="flex gap-2">
                        <Button icon="pi pi-history" text rounded aria-label="Historique" onClick={() => onShowHistory(item)} />
                        <Button icon="pi pi-pencil" text rounded aria-label="Modifier" onClick={() => onEdit(item)} />
                    </div>
                </div>

                <div className="flex flex-col gap-1 text-sm text-surface-500">
                    {item.barcode && <span>Code-barres : {item.barcode}</span>}
                    {item.expirationDate && <span>Péremption : {format(parseISO(item.expirationDate), "dd/MM/yyyy")}</span>}
                    {item.imageUrl && <span className="truncate">Image : {item.imageUrl}</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Button label="-1" severity="secondary" outlined onClick={() => onQuickMovement(item, "OUT")} />
                    <Button label="+1" onClick={() => onQuickMovement(item, "IN")} />
                    <Button label="Ajuster" text onClick={() => onAdjust(item)} />
                    <Button label="Supprimer" text severity="danger" onClick={() => onDelete(item)} />
                </div>
            </div>
        </div>
    );
}
