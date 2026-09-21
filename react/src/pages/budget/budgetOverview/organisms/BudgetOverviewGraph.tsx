import { useState, useMemo } from "react";
import { GroupedBudgetData } from "../BudgetOverviewCalculations";
import { Chart } from "primereact/chart";
import { ChartData, ChartOptions, Plugin } from "chart.js";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import PosteDetailsPanel from "../molecules/PosteDetailsPanel";

interface BudgetOverviewGraphProps {
  datas: GroupedBudgetData[];
}

export default function BudgetOverviewGraph({ datas }: BudgetOverviewGraphProps) {
  const [selectedPosteLabel, setSelectedPosteLabel] = useState<string | null>(null);


  // Postes ayant des dépenses à afficher
  const activeDatas = useMemo(() => {
    return datas.filter((d) => d.debitTotal > 0);
  }, [datas]);

  // Poste sélectionné
  const selectedPosteData = useMemo(() => {
    if (!selectedPosteLabel) return null;
    return activeDatas.find((d) => d.posteLabel === selectedPosteLabel) || null;
  }, [activeDatas, selectedPosteLabel]);

  // Chart Data: Ventilation Dépenses Libre vs Récurrent
  const chartData: ChartData = useMemo(() => {
    const labels = activeDatas.map((d) => d.posteLabel);

    const budgetAmounts = activeDatas.map((d) =>
      d.lines.filter((l) => l.source === "budget").reduce((sum, l) => sum + l.debit, 0)
    );

    const recurringAmounts = activeDatas.map((d) =>
      d.lines.filter((l) => l.source === "recurring").reduce((sum, l) => sum + l.debit, 0)
    );

    return {
      labels,
      datasets: [
        {
          label: "Budget Libre",
          data: budgetAmounts,
          backgroundColor: "#38bdf8", // Sky-400
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: "Récurrent (Charges)",
          data: recurringAmounts,
          backgroundColor: "#34d399", // Emerald-400
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [activeDatas]);

  // Plugin Chart.js personnalisé pour dessiner le montant TOTAL en fin de barre
  const totalLabelsPlugin: Plugin<"bar"> = useMemo(() => {
    return {
      id: "alwaysVisibleTotalLabels",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = "600 11px sans-serif";
        ctx.fillStyle = "#cbd5e1"; // Slate-300
        ctx.textBaseline = "middle";

        activeDatas.forEach((data, index) => {
          const meta = chart.getDatasetMeta(index); // Dernier dataset empilé
          if (meta && meta.data[index]) {
            const bar = meta.data[index];
            const totalText = toMonetaryAmount(data.debitTotal);
            ctx.fillText(totalText, bar.x + 8, bar.y);
          }
        });

        ctx.restore();
      },
    };
  }, [activeDatas]);

  // Chart Options
  const chartOptions: ChartOptions = useMemo(() => {
    return {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      // Curseur pointer au survol d'une barre
      onHover: (event, chartElements) => {
        const target = event.native?.target as HTMLElement;
        if (target) {
          target.style.cursor = chartElements.length > 0 ? "pointer" : "default";
        }
      },
      onClick: (_, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const clickedPoste = activeDatas[index];
          setSelectedPosteLabel((prev) =>
            prev === clickedPoste.posteLabel ? null : clickedPoste.posteLabel
          );
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#cbd5e1",
            font: { family: "Inter, sans-serif", size: 12 },
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${toMonetaryAmount(ctx.raw as number)}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: {
            color: "#94a3b8",
            callback: (v) => `${v} €`,
          },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { color: "#f1f5f9", font: { size: 12, weight: 500 } },
        },
      },
    };
  }, [activeDatas]);

  return (
    <div className="flex flex-col gap-5 w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
      {/* Content Layout: Split View Graph (70%) / Side Panel (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div
          className={`transition-all duration-300 ${
            selectedPosteData ? "lg:col-span-8" : "lg:col-span-12"
          }`}
        >
          <div className="h-[380px] w-full">
            <Chart
              type="bar"
              data={chartData}
              options={chartOptions}
              plugins={[totalLabelsPlugin]}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* 3. Micro View: Panneau latéral dynamique au clic */}
        {selectedPosteData && (
          <div className="lg:col-span-4 h-[380px]">
            <PosteDetailsPanel
              posteData={selectedPosteData}
              onClose={() => setSelectedPosteLabel(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}