import { useEffect, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockItem from "@/interfaces/stocks/StockItem";
import StockItemUnitsView from "./StockItemUnitsView";
import { useScreen } from "@/hooks/useScreen";
import { Divider } from "primereact/divider";

interface StockItemsDatatableProps {
    locationId: number | null;
    searchQuery: string;
    afterRemoveStockUnitOptimistic?(unitId: number, locationId: number): void;
}

const stockService = new StockItemsService();

export default function StockItemsList({ locationId, searchQuery, afterRemoveStockUnitOptimistic }: StockItemsDatatableProps) {

    const { isDesktop } = useScreen()
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [filteredStockItems, setFilteredStockItems] = useState<StockItem[]>([]);
    const [expandedRows, setExpandedRows] = useState<StockItem[]>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadData()
    }, [locationId,]);

    useEffect(() => {
        if (searchQuery !== "") {
            setFilteredStockItems(stockItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredStockItems(stockItems);
        }
    }, [searchQuery, stockItems]);

    const loadData = async () => {
        setLoading(true);
        const data = await stockService.getAllStockItems(locationId ?? undefined);
        setStockItems(data);
        setFilteredStockItems(data);
        setLoading(false);
    }

    /**
     * Affichage mobile
     */
    if (!isDesktop) {
        return (
            <div className="flex flex-col gap-2">
                {
                    filteredStockItems.map(item => (
                        <div
                            key={item.id}
                            className="flex-1 gap-1 rounded border-2 border-surface p-2"
                        >
                            <div className="flex justify-between">

                                <span className="font-semibold">{item.label}</span>
                                <span>{item.stockUnitsCount}</span>
                            </div>
                            <Divider />
                            <div>
                                <StockItemUnitsView
                                    stockItemId={item.id}
                                    locationId={locationId}
                                    afterRemoveStockUnitOptimistic={(unitId, locationId) => locationId && afterRemoveStockUnitOptimistic?.(unitId, locationId)}
                                />
                            </div>
                        </div>
                    ))
                }
            </div>
        )

    }

    return (
        <FillRemainingHeight>
            <DataTable
                value={filteredStockItems}
                size="small"
                // Expanded rows
                expandedRows={expandedRows}
                onRowToggle={(event) => setExpandedRows(event.data as StockItem[])}
                rowExpansionTemplate={(stockItem: StockItem) => (
                    <StockItemUnitsView
                        stockItemId={stockItem.id}
                        locationId={locationId}
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
                    header="Stock"
                    field="stockUnitsCount"
                />
            </DataTable>
        </FillRemainingHeight>
    );
}
