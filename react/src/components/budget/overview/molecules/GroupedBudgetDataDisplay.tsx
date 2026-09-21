import ColorDot from "@/components/atoms/ColorDot";
import { GroupedBudgetData } from "@/pages/budget/budgetOverview/BudgetOverviewCalculations";
import SourceBadge from "@/pages/budget/budgetOverview/atoms/SourceBadge";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import { UnifiedBudgetLine } from "@chocosous/shared";

interface GroupedBudgetDataDisplayProps {
    groupBudget: GroupedBudgetData,
    isHighlighted?: boolean
}

export default function GroupedBudgetDataDisplay({ groupBudget, isHighlighted = false }: GroupedBudgetDataDisplayProps) {
    return (
        <div className={`space-y-2`}        >
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className={`flex min-w-0 items-center gap-2 font-semibold text-slate-100 ${isHighlighted ? "text-slate-100" : "text-slate-400"}`}>
                    <ColorDot color={groupBudget.posteColor ?? "#38bdf8"} />
                    <span className="truncate">{groupBudget.posteLabel}</span>
                </span>
                <h4>{toMonetaryAmount(groupBudget.debitTotal)}</h4>
            </div>
            <div className={`space-y-1 border-l ${isHighlighted ? "border-slate-500" : "border-slate-700"} pl-4`}>
                {groupBudget.lines.filter((line: UnifiedBudgetLine) => line.debit > 0).map((line) => (
                    <div className="flex items-center justify-between gap-2 text-xs" key={line.id}>
                        <span className="flex min-w-0 items-center gap-2 text-slate-400">
                            <SourceBadge source={line.source} isCompact={true} />
                            <span className="truncate">{line.label}</span>
                        </span>
                        <span>{toMonetaryAmount(line.debit)}</span>
                        {/* <AmountText amount={line.debit} kind="debit" /> */}
                    </div>
                ))}
            </div>
        </div>
    );
}