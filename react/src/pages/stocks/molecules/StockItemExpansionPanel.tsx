import { Timeline } from "primereact/timeline";
import { ProgressSpinner } from "primereact/progressspinner";
import { format, parseISO } from "date-fns";
import StockItem from "@/interfaces/stocks/StockItem";
import StockMovement from "@/interfaces/stocks/StockMovement";

interface StockItemExpansionPanelProps {
    item: StockItem;
    movements: StockMovement[] | "loading" | "error" | undefined;
}

export default function StockItemExpansionPanel({ item, movements }: StockItemExpansionPanelProps) {
    const hasDetails = Boolean(item.barcode || item.imageUrl);

    return (
        <div className="flex flex-col gap-3 py-2 text-sm text-surface-500">
            {hasDetails && (
                <div className="flex flex-col gap-1">
                    {item.barcode && <span>Code-barres : {item.barcode}</span>}
                    {item.imageUrl && <span className="truncate">Image : {item.imageUrl}</span>}
                </div>
            )}

            <div className={hasDetails ? "border-t border-surface-200 pt-3" : undefined}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-400">
                    Historique des mouvements
                </div>

                {movements === "loading" && (
                    <div className="flex justify-center p-4">
                        <ProgressSpinner style={{ width: "2rem", height: "2rem" }} />
                    </div>
                )}
                {movements === "error" && <span className="text-red-500">Impossible de charger l'historique.</span>}
                {movements && movements !== "loading" && movements !== "error" && (
                    movements.length === 0 ? (
                        <span>Aucun mouvement pour ce produit.</span>
                    ) : (
                        <div className="max-h-64 overflow-y-auto pr-2">
                            <Timeline
                                value={movements}
                                opposite={(movement: StockMovement) => (
                                    <span className="text-xs whitespace-nowrap">
                                        {format(parseISO(movement.occurredAt), "dd/MM/yyyy HH:mm")}
                                    </span>
                                )}
                                marker={(movement: StockMovement) => (
                                    <span className={`pi ${movement.type === "IN" ? "pi-arrow-circle-up text-green-600" : "pi-arrow-circle-down text-red-500"}`} />
                                )}
                                content={(movement: StockMovement) => (
                                    <span>
                                        {movement.type === "IN" ? "+" : "-"}{movement.quantity} {item.unit}
                                        {movement.source && <span className="text-surface-400"> · {movement.source}</span>}
                                    </span>
                                )}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
