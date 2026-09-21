import type { UnifiedBudgetLine } from "@chocosous/shared";
import type { GroupedBudgetData } from "@/pages/budget/budgetOverview/BudgetOverviewCalculations";
import BalanceGauge from "../molecules/BalanceGauge";
import ExpenseTypologyBar from "../molecules/ExpenseTypologyBar";
import IncomeList from "../molecules/IncomeList";
import ExpenseDistribution from "./ExpenseDistribution";

interface BudgetDashboardViewProps {
    datas: GroupedBudgetData[];
}

export default function BudgetDashboardView({ datas }: BudgetDashboardViewProps) {
    const globalCredit = datas.reduce((sum, data) => sum + data.creditTotal, 0);
    const globalDebit = datas.reduce((sum, data) => sum + data.debitTotal, 0);
    const incomeLines: UnifiedBudgetLine[] = datas.flatMap((data) => data.lines.filter((line) => line.credit > 0));
    const globalRecurring = datas.reduce(
        (sum, data) => sum + data.lines.filter((line) => line.source === "recurring").reduce((lineSum, line) => lineSum + line.debit, 0),
        0,
    );
    const globalBudget = datas.reduce(
        (sum, data) => sum + data.lines.filter((line) => line.source === "budget").reduce((lineSum, line) => lineSum + line.debit, 0),
        0,
    );
    const expenseDatas = datas.filter((data) => data.debitTotal > 0);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-5 rounded-xl border border-slate-700/80 bg-slate-800/50 p-5 lg:col-span-4">
                <BalanceGauge totalCredit={globalCredit} totalDebit={globalDebit} netTotal={globalCredit - globalDebit} />
                <div className="border-t border-slate-700 pt-5">
                    <IncomeList lines={incomeLines} />
                </div>
            </div>
            <div className="flex flex-col gap-5 rounded-xl border border-slate-700/80 bg-slate-800/50 p-5 lg:col-span-8">
                <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-100">Typologie des dépenses</h2>
                    <ExpenseTypologyBar recurringTotal={globalRecurring} budgetTotal={globalBudget} />
                </div>
                <div className="border-t border-slate-700 pt-5">
                    <h2 className="mb-4 text-sm font-semibold text-slate-100">Répartition des dépenses</h2>
                    <ExpenseDistribution datas={expenseDatas} />
                </div>
            </div>
        </div>
    );
}