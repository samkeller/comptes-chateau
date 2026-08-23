import TooltipInfoIcon from "@/components/TooltipInfoIcon";
import { DashboardOverview } from "@/interfaces/DashboardOverview";
import { useScreen } from "@/hooks/useScreen";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { useMemo, useState } from "react";

interface DashboardBalanceCardProps {
    overview: DashboardOverview;
}

export default function DashboardBalanceCard({ overview }: DashboardBalanceCardProps) {
    const { isMobile } = useScreen();
    const [timelineActiveIndex, setTimelineActiveIndex] = useState<number>(0);

    const getBalanceClass = (value: number): string => {
        if (value < 0) return "text-red-500";
        if (value <= 100) return "text-orange-500";
        return "text-green-500";
    };


    const timeLineValues = [{
        labelSuffix: "ce mois",
        value: overview.forecastBalanceMonthEnd,
        displayValue: toMonetaryAmount(overview.forecastBalanceMonthEnd),
    }, {
        labelSuffix: "3 mois",
        value: overview.forecastBalanceThreeMonths,
        displayValue: toMonetaryAmount(overview.forecastBalanceThreeMonths)
    }, {
        labelSuffix: "final",
        value: overview.forecastBalanceFinal,
        displayValue: toMonetaryAmount(overview.forecastBalanceFinal)
    }]

    const currentForecastValue = useMemo(() =>
        timeLineValues[timelineActiveIndex],
        [timelineActiveIndex, timeLineValues]
    );

    return (
        <Card title="Solde" className="h-full">
            <div className="flex h-full flex-col md:flex-row">
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">Actuel</span>
                        <TooltipInfoIcon tooltipText="Prend en compte uniquement les opérations 'validées' dont les natures de dépenses sont liées au compte en banque. Représente l'état actuel du compte." />
                    </div>
                    <div className={`text-3xl font-bold ${getBalanceClass(overview.currentBalance)}`}>{toMonetaryAmount(overview.currentBalance)}</div>
                    <div className="text-surface-500 text-sm">Opérations validées uniquement</div>
                </div>
                <Divider layout={isMobile ? "horizontal" : "vertical"} className="shrink" />
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            text rounded
                            icon="pi pi-angle-left"
                            tooltip="Précédent"
                            tooltipOptions={{ position: "left" }}
                            size="small"
                            disabled={timelineActiveIndex === 0}
                            className="p-0 h-6 w-6"
                            onClick={() => setTimelineActiveIndex(Math.max(0, timelineActiveIndex - 1))}
                        />
                        <span className="font-semibold text-lg grow">Prévisionnel - {currentForecastValue.labelSuffix}</span>
                        <TooltipInfoIcon tooltipText="Prend en compte toutes les opérations (validées ou non) dont les natures de dépenses sont liées au compte en banque." />
                        <Button
                            text rounded
                            icon="pi pi-angle-right"
                            tooltip="Suivant"
                            tooltipOptions={{ position: "right" }}
                            size="small"
                            disabled={timelineActiveIndex === timeLineValues.length - 1}
                            className="p-0 h-6 w-6"
                            onClick={() => setTimelineActiveIndex(Math.min(timeLineValues.length - 1, timelineActiveIndex + 1))}
                        />
                    </div>
                    <div className="flex flex-row">
                        <div className={`grow text-3xl font-bold ${getBalanceClass(currentForecastValue.value)}`}>{currentForecastValue.displayValue}</div>
                    </div>
                    <div className="text-surface-500 text-sm">Toutes les opérations validées & à venir</div>
                </div>
            </div>
        </Card>
    );
}
