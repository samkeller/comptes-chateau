import { ProgressBar } from "primereact/progressbar";

interface ExpenseTypologyBarProps {
    recurringTotal: number;
    budgetTotal: number;
}

export default function ExpenseTypologyBar({ recurringTotal, budgetTotal }: ExpenseTypologyBarProps) {
    const total = recurringTotal + budgetTotal;
    const recurringPercentage = total > 0 ? (recurringTotal / total) * 100 : 0;

    return (
        <div className="flex flex-col gap-2">
            <h2>Typologie des dépenses</h2>
            <ProgressBar
                value={recurringPercentage}
                showValue={false}
                pt={{
                    value: { className: "bg-success" },
                    root: { className: "bg-info/80 h-3" }
                }}
            />
            <div className="flex justify-between text-xs text-slate-400">
                <span>Dépenses récurrentes <span className="text-success">{recurringPercentage.toFixed(0)}%</span></span>
                <span><span className="text-info">{(100 - recurringPercentage).toFixed(0)}%</span> Budget</span>
            </div>
        </div>
    );
}