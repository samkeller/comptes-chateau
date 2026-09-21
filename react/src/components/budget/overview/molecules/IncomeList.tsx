import type { UnifiedBudgetLine } from "@chocosous/shared";
import AmountText from "../atoms/AmountText";

interface IncomeListProps {
    lines: UnifiedBudgetLine[];
}

export default function IncomeList({ lines }: IncomeListProps) {
    const total = lines.reduce((sum, line) => sum + line.credit, 0);

    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100">Revenus / Recettes</h2>
            <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
                {lines.map((line) => (
                    <div className="flex items-center justify-between gap-3 text-sm" key={line.id}>
                        <span className="min-w-0 truncate text-slate-300">{line.label}</span>
                        <AmountText amount={line.credit} kind="credit" />
                    </div>
                ))}
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-3 text-sm font-bold text-slate-100">
                <span>Total</span>
                <AmountText amount={total} kind="credit" />
            </div>
        </div>
    );
}