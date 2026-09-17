import { toMonetaryAmount } from "@/utils/NumberUtils";
import { BudgetOverviewTotals } from "../BudgetOverviewCalculations";

interface BudgetSummaryProps {
    totals: BudgetOverviewTotals;
}

export default function BudgetSummary({
    totals,
}: BudgetSummaryProps) {
    const { creditTotal, debitTotal, netTotal } = totals;

    const summaryData = [
        { label: "Recettes", value: toMonetaryAmount(creditTotal), icon: "pi pi-arrow-up-right" },
        { label: "Dépenses", value: toMonetaryAmount(debitTotal), icon: "pi pi-arrow-down-right" },
        { label: "Solde", value: toMonetaryAmount(netTotal), icon: "pi pi-wallet" },
    ]

    return (
        <div className="flex justify-between items-center gap-4 my-2">
            {
                summaryData.map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center-safe gap-2 rounded-lg border border-surface-200 bg-surface-0/85 px-2 py-1 shadow-sm backdrop-blur-sm">
                        <i className={icon} />
                        <div className="flex flex-col text-right">
                            <span className="text-xs text-surface-500">{label}</span>
                            <span className={`font-semibold `}>{value}</span>
                        </div>
                    </div>
                ))
            }
        </div>
    );
}
