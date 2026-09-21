import React from "react";
import { toMonetaryAmount } from "@/utils/NumberUtils";

interface GlobalBudgetGaugeProps {
    totalCredit: number;
    totalDebit: number;
}

export const GlobalBudgetGauge: React.FC<GlobalBudgetGaugeProps> = ({
    totalCredit,
    totalDebit,
}) => {
    // Ratio de couverture des dépenses par rapport aux recettes
    const debitRatio = totalCredit > 0 ? Math.min((totalDebit / totalCredit) * 100, 100) : 100;
    const netTotal = totalCredit - totalDebit;
    const isDeficit = netTotal < 0;

    return (
        <div className="flex flex-col gap-2">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:text-left">
                <div>
                    <span className="text-xs text-slate-400 block uppercase font-medium">
                        <i className="pi pi-arrow-up-right"></i>&nbsp;
                        Recettes
                    </span>
                    <span className="text-base font-bold text-success font-mono">
                        {toMonetaryAmount(totalCredit)}
                    </span>
                </div>
                <div>
                    <span className="text-xs text-slate-400 block uppercase font-medium">
                        <i className="pi pi-arrow-down-right"></i>&nbsp;
                        Dépenses
                    </span>
                    <span className="text-base font-bold text-error font-mono">
                        {toMonetaryAmount(totalDebit)}
                    </span>
                </div>
                <div>
                    <span className="text-xs text-slate-400 block uppercase font-medium">
                        <i className="pi pi-wallet"></i>&nbsp;
                        Solde Net
                    </span>
                    <span
                        className={`text-base font-bold font-mono ${isDeficit
                            ? "text-error"
                            : "text-success"
                            }`}
                    >
                        {toMonetaryAmount(netTotal)}
                    </span>
                </div>
            </div>

            {/* Progress Gauge */}
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden flex border border-slate-700/50">
                <div
                    className="bg-error h-full transition-all duration-500"
                    style={{ width: `${debitRatio}%` }}
                    title={`Dépenses: ${debitRatio.toFixed(1)}%`}
                />
                <div
                    className="bg-success h-full transition-all duration-500 flex-1"
                    title={`Solde restant: ${toMonetaryAmount(netTotal)}`}
                />
            </div>
        </div>
    );
};