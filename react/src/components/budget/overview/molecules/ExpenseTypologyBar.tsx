interface ExpenseTypologyBarProps {
    recurringTotal: number;
    budgetTotal: number;
}

export default function ExpenseTypologyBar({ recurringTotal, budgetTotal }: ExpenseTypologyBarProps) {
    const total = recurringTotal + budgetTotal;
    const recurringPercentage = total > 0 ? (recurringTotal / total) * 100 : 0;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-sky-400/80" aria-label="Répartition des dépenses">
                <div className="bg-success" style={{ width: `${recurringPercentage}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
                <span><span className="text-success">{recurringPercentage.toFixed(0)}%</span> Fixe</span>
                <span><span className="text-info">{(100 - recurringPercentage).toFixed(0)}%</span> Libre</span>
            </div>
        </div>
    );
}