import { format } from "date-fns";
import StockUnit from "@/interfaces/stocks/StockUnit";

interface StockUnitSummaryProps {
    unit: StockUnit;
}

export default function StockUnitSummary({ unit }: StockUnitSummaryProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-semibold">{unit.item.label}</span>
            <span className="text-sm text-surface-500">
                {unit.quantity} {unit.unit}
                {unit.expirationDate && ` - peremption ${format(unit.expirationDate, "dd/MM/yyyy")}`}
            </span>
        </div>
    );
}
