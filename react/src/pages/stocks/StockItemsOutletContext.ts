import StockItem from "@/interfaces/stocks/StockItem";

export interface StockItemsOutletContext {
    items: StockItem[];
    loading: boolean;
    onShowHistory: (item: StockItem) => void;
    onEdit: (item: StockItem) => void;
    onAdjust: (item: StockItem) => void;
    onDelete: (item: StockItem) => void;
    onQuickMovement: (item: StockItem, type: "IN" | "OUT") => void;
}
