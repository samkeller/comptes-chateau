import { Tag } from "primereact/tag";
import type { StockMovementType } from "@chocosous/shared";

const STOCK_MOVEMENT_DISPLAY: Record<StockMovementType, { label: string; severity: "success" | "info" | "danger"; icon: string }> = {
    IN: { label: "Entrée", severity: "success", icon: "pi pi-plus" },
    OUT: { label: "Coché", severity: "info", icon: "pi pi-check" },
    DELETE: { label: "Supprimé", severity: "danger", icon: "pi pi-times" },
};

interface StockMovementTypeTagProps {
    type: StockMovementType;
}

export default function StockMovementTypeTag({ type }: StockMovementTypeTagProps) {
    const display = STOCK_MOVEMENT_DISPLAY[type];
    return <Tag value={display.label} severity={display.severity} icon={display.icon} />;
}
