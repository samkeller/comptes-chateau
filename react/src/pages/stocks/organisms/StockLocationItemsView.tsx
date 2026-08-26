import { useOutletContext } from "react-router-dom";
import { ProgressSpinner } from "primereact/progressspinner";
import { ScrollPanel } from "primereact/scrollpanel";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import { useScreen } from "@/hooks/useScreen";
import StockItemCard from "@/pages/stocks/molecules/StockItemCard";
import { StockItemsOutletContext } from "@/pages/stocks/StockItemsOutletContext";

export default function StockLocationItemsView() {
    const { isDesktop } = useScreen();
    const { items, loading, onShowHistory, onEdit, onAdjust, onDelete, onQuickMovement } =
        useOutletContext<StockItemsOutletContext>();

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <ProgressSpinner />
            </div>
        );
    }

    if (items.length === 0) {
        return <div className="text-surface-500">Aucun produit dans ce lieu.</div>;
    }

    const itemsGrid = (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {items.map((item) => (
                <StockItemCard
                    key={item.id}
                    item={item}
                    onShowHistory={onShowHistory}
                    onEdit={onEdit}
                    onAdjust={onAdjust}
                    onDelete={onDelete}
                    onQuickMovement={onQuickMovement}
                />
            ))}
        </div>
    );

    if (!isDesktop) {
        return itemsGrid;
    }

    return (
        <FillRemainingHeight>
            <ScrollPanel className="h-full w-full">
                {itemsGrid}
            </ScrollPanel>
        </FillRemainingHeight>
    );
}
