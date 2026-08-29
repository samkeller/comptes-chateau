import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ChartData, ChartDataset, ChartOptions, TooltipItem } from "chart.js";
import type { MonthlyAggregateByPoste } from "@chocosous/shared";
import { toMonetaryAmount } from "../../../utils/NumberUtils";

interface MonthlyPosteChartProps {
    data: MonthlyAggregateByPoste[];
}

export default function MonthlyPosteChart({ data }: MonthlyPosteChartProps) {

    const chartData: ChartData<"line", number[], string> = useMemo(() => {
        // Extraction des mois uniques triés
        const monthsSet = new Set<string>();
        data.forEach((d) => {
            const key = `${d.year}-${d.month.toString().padStart(2, "0")}`;
            monthsSet.add(key);
        });

        const sortedMonths = Array.from(monthsSet).sort();

        // Extraction des postes uniques
        const postesMap = new Map<
            number,
            { label: string; color: string; data: number[] }
        >();

        data.forEach((d) => {
            if (!postesMap.has(d.posteId)) {
                postesMap.set(d.posteId, {
                    label: d.posteLabel,
                    color: d.posteColor,
                    data: new Array(sortedMonths.length).fill(0),
                });
            }
        });

        // Remplissage des données par poste et mois
        data.forEach((d) => {
            const monthKey = `${d.year}-${d.month.toString().padStart(2, "0")}`;
            const monthIndex = sortedMonths.indexOf(monthKey);
            const poste = postesMap.get(d.posteId)!;
            poste.data[monthIndex] = d.total;
        });

        const datasets: ChartDataset<"line", number[]>[] = Array.from(postesMap.values()).map((poste) => ({
            label: poste.label,
            data: poste.data,
            borderColor: poste.color,
            backgroundColor: poste.color + "33", // transparence 20%
            tension: 0.3,
            borderWidth: 1,
            pointRadius: 0, // ne pas afficher les points
            fill: false,
        }));

        return {
            labels: sortedMonths,
            datasets,
        };
    }, [data]);

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: "index",
                intersect: false,
                filter: (tooltipItem: TooltipItem<"line">) => {
                    // Ne pas afficher les tooltips pour les points à 0
                    // (car on ne les affiche pas sur le graphique)
                    return tooltipItem.parsed.y !== 0;

                },
                callbacks: {
                    label: (context: TooltipItem<"line">) => {
                        const label = context.dataset.label || "";
                        const value = context.parsed.y;
                        if (typeof value !== "number") return label;
                        return `${label}: ${toMonetaryAmount(value)}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => {
                        if (typeof value !== "number") return value;
                        return toMonetaryAmount(value);
                    },
                },
            },
        },
    };

    return (
        <div style={{ height: "400px" }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
