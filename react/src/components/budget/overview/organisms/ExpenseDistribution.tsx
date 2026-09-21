import { useMemo } from "react";
import { Chart } from "primereact/chart";
import type { ChartData, ChartOptions, Plugin } from "chart.js";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import type { UnifiedBudgetLine } from "@chocosous/shared";
import type { GroupedBudgetData } from "@/pages/budget/budgetOverview/BudgetOverviewCalculations";
import AmountText from "../atoms/AmountText";
import SourceBadge from "@/pages/budget/budgetOverview/atoms/SourceBadge";

interface ExpenseDistributionProps {
    datas: GroupedBudgetData[];
}

export default function ExpenseDistribution({ datas }: ExpenseDistributionProps) {
    const total = datas.reduce((sum, data) => sum + data.debitTotal, 0);
    const chartData: ChartData<"doughnut", number[], string> = useMemo(() => ({
        labels: datas.map((data) => data.posteLabel),
        datasets: [{
            data: datas.map((data) => data.debitTotal),
            backgroundColor: datas.map((data) => data.posteColor ?? "#38bdf8"),
            borderColor: "#1e293b",
            borderWidth: 3,
        }],
    }), [datas]);
    const centerTextPlugin: Plugin<"doughnut"> = useMemo(() => ({
        id: "budgetCenterText",
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Total", centerX, centerY - 12);
            ctx.fillStyle = "#f1f5f9";
            ctx.font = "600 16px sans-serif";
            ctx.fillText(toMonetaryAmount(total), centerX, centerY + 12);
            ctx.restore();
        },
    }), [total]);
    const chartOptions: ChartOptions<"doughnut"> = {
        cutout: "68%",
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
    };

    return (
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            <div className="mx-auto h-64 w-full max-w-xs">
                <Chart type="doughnut" data={chartData} options={chartOptions} plugins={[centerTextPlugin]} />
            </div>
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
                {datas.map((data) => (
                    <div key={`${data.posteId ?? "none"}-${data.posteLabel}`} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-100">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: data.posteColor ?? "#38bdf8" }} />
                                <span className="truncate">{data.posteLabel}</span>
                            </span>
                            <AmountText amount={data.debitTotal} kind="debit" />
                        </div>
                        <div className="space-y-1 border-l border-slate-700 pl-4">
                            {data.lines.filter((line: UnifiedBudgetLine) => line.debit > 0).map((line) => (
                                <div className="flex items-center justify-between gap-2 text-xs" key={line.id}>
                                    <span className="flex min-w-0 items-center gap-2 text-slate-400">
                                        <SourceBadge source={line.source} isCompact={true} />
                                        <span className="truncate">{line.label}</span>
                                    </span>
                                    <AmountText amount={line.debit} kind="debit" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}