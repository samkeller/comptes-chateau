import { ReactNode } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import StockLocation from "@/interfaces/stocks/StockLocation";

interface StockItemsPanelProps {
    selectedLocation: StockLocation | null;
    onAddItem: () => void;
    className?: string;
    children: ReactNode;
}

export default function StockItemsPanel({ selectedLocation, onAddItem, className, children }: StockItemsPanelProps) {
    return (
        <Card
            title={selectedLocation ? `Produits — ${selectedLocation.label}` : "Produits"}
            className={className}
            pt={{ body: { className: "h-full" }, content: { className: "h-full flex flex-col gap-4" } }}
        >
            {selectedLocation && (
                <div className="flex justify-end">
                    <Button label="Ajouter un produit" icon="pi pi-plus" size="small" onClick={onAddItem} />
                </div>
            )}

            {children}
        </Card>
    );
}

