import type { UnifiedBudgetLine } from "@chocosous/shared";
import { Divider } from "primereact/divider";
import { toMonetaryAmount } from "@/utils/NumberUtils";

interface IncomeListProps {
    lines: UnifiedBudgetLine[];
}

export default function IncomeList({ lines }: IncomeListProps) {
    const total = lines.reduce((sum, line) => sum + line.credit, 0);

    return (
        <div className="flex flex-col gap-3">
            <h2>Revenus / Recettes</h2>
            <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
                {lines.map((line) => (
                    <div className="flex items-center justify-between gap-3 text-sm" key={line.id}>
                        <span className="min-w-0 truncate">{line.label}</span>
                        <span>{toMonetaryAmount(line.credit)}</span>
                    </div>
                ))}
            </div>
            <Divider />
            <div className="flex justify-between">
                <span>Total</span>
                <span>{toMonetaryAmount(total)}</span>
            </div>
        </div>
    );
}