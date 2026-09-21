import { toMonetaryAmount } from "@/utils/NumberUtils";

interface BalanceGaugeProps {
    totalCredit: number;
    totalDebit: number;
    netTotal: number;
}

export default function BalanceGauge({ totalCredit, totalDebit, netTotal }: BalanceGaugeProps) {
    const ratio = totalCredit > 0 ? (totalDebit / totalCredit) * 100 : totalDebit > 0 ? 100 : 0;
    const width = Math.min(ratio, 100);
    const barColor = ratio > 100
        ? "bg-error"
        : ratio >= 90
            ? "bg-warn"
            : "bg-success";

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-3 text-xs text-slate-400">
                <span>Recettes : <strong className="text-slate-200">{toMonetaryAmount(totalCredit)}</strong></span>
                <span>Dépenses : <strong className="text-slate-200">{toMonetaryAmount(totalDebit)}</strong></span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-700/80" aria-label="Progression des dépenses">
                <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${width}%` }} />
            </div>
            <div className={`text-right text-sm font-semibold ${netTotal < 0
                ? "text-error"
                : "text-success"}`
            }>
                Reste : {toMonetaryAmount(netTotal)}
            </div>
        </div>
    );
}