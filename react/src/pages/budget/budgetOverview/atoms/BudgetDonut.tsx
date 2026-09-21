import { GroupedBudgetData } from "../BudgetOverviewCalculations";
import { ChartData, ChartOptions, Plugin } from "chart.js";
import { useEffect, useMemo } from "react";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import { Chart } from "primereact/chart";

interface BudgetDonutProps {
    /**
     * Les données groupées par poste budgétaire.
     */
    datas: GroupedBudgetData[];
    /**
     * Appelé lorsque l'utilisateur survole un poste budgétaire.
     */
    onHoverPoste?: (posteId: number | null) => void;

    /**
     * Appelé lorsque l'utilisateur clique sur un poste budgétaire.
     * @param posteId 
     * @returns 
     */
    onClickPoste?: (posteId: number | null) => void;
}

/**
 * TODO - Re-render du composant au survol d'un poste budgétaire.
 * @param param0 
 * @returns 
 */
export default function BudgetDonut({ datas, onHoverPoste, onClickPoste }: BudgetDonutProps) {
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
            /**
             * Affiche le total au milieu du donut
             */
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

    const chartOptions: ChartOptions<"doughnut"> = useMemo(() => ({
        cutout: "68%",
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        onHover: (_event, elements) => {
            const canvas = _event.native?.target as HTMLCanvasElement | undefined;

            // Change le curseur pour indiquer que la zone est clickable.
            if (canvas) {
                canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
            }

            if (elements.length === 0) {
                onHoverPoste?.(null);
                return;
            }

            const index = elements[0].index;
            const poste = datas[index];

            onHoverPoste?.(poste.posteId);
        },
        onClick: (_event, elements) => {
            if (elements.length === 0) {
                onClickPoste?.(null);
                return;
            }

            const index = elements[0].index;
            const poste = datas[index];

            onClickPoste?.(poste.posteId);
        },
    }), [datas, onHoverPoste, onClickPoste]);

    return (<Chart
        type="doughnut"
        data={chartData}
        options={chartOptions}
        plugins={[centerTextPlugin]}
        className="w-full max-w-125"
    />);
}