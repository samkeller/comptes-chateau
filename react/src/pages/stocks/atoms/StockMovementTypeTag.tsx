import { Tag } from "primereact/tag";
import type { StockMovementType } from "@chocosous/shared";

const STOCK_MOVEMENT_DISPLAY: Record<StockMovementType, { label: string; severity: "success" | "info" | "danger" }> = {
    IN: { label: "Entrée", severity: "success" },
    OUT: { label: "Consommé", severity: "info" },
    DELETE: { label: "Supprimé", severity: "danger" },
};

interface StockMovementTypeTagProps {
    type: StockMovementType;
}

export default function StockMovementTypeTag({ type }: StockMovementTypeTagProps) {
    const display = STOCK_MOVEMENT_DISPLAY[type];
    return <Tag value={display.label} severity={display.severity} />;
}
