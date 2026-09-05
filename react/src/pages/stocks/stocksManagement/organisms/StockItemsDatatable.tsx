import { useEffect, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockItem from "@/interfaces/stocks/StockItem";
import StockItemUnitsView from "./StockItemUnitsView";

interface StockItemsDatatableProps {
    locationId: number | null;
    afterRemoveStockUnitOptimistic?(unitId: number, locationId: number): void;
}

const stockService = new StockItemsService();

export default function StockItemsDatatable({ locationId, afterRemoveStockUnitOptimistic }: StockItemsDatatableProps) {

    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [expandedRows, setExpandedRows] = useState<StockItem[]>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadData()
    }, [locationId]);

    const loadData = async () => {
        setLoading(true);
        const data = await stockService.getAllStockItems(locationId ?? undefined);
        setStockItems(data);
        // Expand la première row
        setExpandedRows(data.length > 0 ? [data[0]] : []);
        setLoading(false);
    }

    return (
        <FillRemainingHeight>
            <DataTable
                value={stockItems}
                size="small"
                // Expanded rows
                expandedRows={expandedRows}
                onRowToggle={(event) => setExpandedRows(event.data as StockItem[])}
                rowExpansionTemplate={(stockItem: StockItem) => (
                    <StockItemUnitsView
                        stockItemId={stockItem.id}
                        afterRemoveStockUnitOptimistic={(unitId, locationId) => locationId && afterRemoveStockUnitOptimistic?.(unitId, locationId)}
                    />
                )}

                // Scroll
                scrollable
                scrollHeight="flex"
                className="pb-4 w-full"
                loading={loading}
                emptyMessage="Aucun produit disponible"
            >
                <Column expander style={{ width: "4rem" }} />
                <Column
                    field="label"
                    header="Produit"
                    body={(item: StockItem) => (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold">{item.label}</span>
                        </div>
                    )}
                />
                <Column
                    header="Compte"
                    field="stockUnitsCount"

                />
            </DataTable>
        </FillRemainingHeight>
    );
}
