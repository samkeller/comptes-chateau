import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import { DashboardOverview } from "../../interfaces/DashboardOverview";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";
import TooltipInfoIcon from "../../components/TooltipInfoIcon";
import { Divider } from "primereact/divider";
import { useAccountId } from "../../hooks/useAccountId";
import BudgetDetailsByPosteCard from "./BudgetDetailsByPosteCard";
import { ProgressBar } from "primereact/progressbar";
import { BudgetByPoste } from "@/interfaces/BudgetByPoste";
import { useScreen } from "@/utils/hooks/useScreen";
import { Button } from "primereact/button";

const dashboardService = new DashboardService();

export default function AccountDashboard() {
    const accountId = useAccountId();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [budgetData, setBudgetData] = useState<BudgetByPoste[]>([]);
    const { isMobile } = useScreen();
    const [currentBudgetDate, setCurrentBudgetDate] = useState<Date>(new Date());

    useEffect(() => {
        // Change seulement si l'accountId change
        const dashboardService = new DashboardService();
        dashboardService.getAccountOverview(accountId).then((overviewData) => setOverview(overviewData))
    }, [accountId]);

    useEffect(() => {
        // Change si l'accountId ou la date du budget change
        dashboardService.getBudgetByPoste(accountId, currentBudgetDate.getMonth() + 1, currentBudgetDate.getFullYear())
            .then((data) => setBudgetData(data))
    }, [accountId, currentBudgetDate]);


    const getBalanceClass = (value: number): string => {
        if (value < 0) return "text-red-500";
        if (value <= 100) return "text-orange-500";
        return "text-green-500";
    };

    const totalBudget = useMemo(() => budgetData.reduce((s, d) => s + d.budgetAmount, 0), [budgetData]);
    const totalActual = useMemo(() => budgetData.reduce((s, d) => s + d.actualAmount, 0), [budgetData]);
    const remaining = totalBudget - totalActual;

    const daysRemainingInMonth = useMemo(() => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.getDate() - today.getDate();
    }, []);

    const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    const isGloballyOver = remaining < 0;

    const monthLabel = useMemo(() => {
        const label = new Date(currentBudgetDate.getFullYear(), currentBudgetDate.getMonth(), 1).toLocaleString("fr-FR", { month: "long", year: "2-digit" });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }, [currentBudgetDate]);

    return (
        <PageTemplate pageTitle="Dashboard">
            {overview && (
                <>
                    <div className="w-full flex gap-1 items-center mb-2">
                        <Button
                            text rounded
                            icon="pi pi-angle-left"
                            tooltip="Mois précédent"
                            tooltipOptions={{ position: "left" }}
                            size="small"
                            onClick={() => {
                                const newDate = new Date(currentBudgetDate);
                                newDate.setMonth(newDate.getMonth() - 1);
                                setCurrentBudgetDate(newDate);
                            }}
                        />
                        <Button
                            text rounded
                            icon="pi pi-home"
                            tooltip="Aujourd'hui"
                            tooltipOptions={{ position: "left" }}
                            size="small"
                            onClick={() => setCurrentBudgetDate(new Date())}
                        />
                        <h2 className="grow">{`Dashboard : (${monthLabel})`} </h2>
                        <Button
                            text rounded
                            icon="pi pi-angle-right"
                            tooltip="Mois suivant"
                            tooltipOptions={{ position: "left" }}
                            size="small"
                            onClick={() => {
                                const newDate = new Date(currentBudgetDate);
                                newDate.setMonth(newDate.getMonth() + 1);
                                setCurrentBudgetDate(newDate);
                            }}
                        />

                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                <Divider
                                    layout={isMobile ? "horizontal" : "vertical"}
                                    className="shrink"
                                />
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">Prévisionnel</span>
                                        <TooltipInfoIcon tooltipText="Prend en compte toutes les opérations (validées ou non) dont les natures de dépenses sont liées au compte en banque." />
                                    </div>
                                    <div className={`text-3xl font-bold ${getBalanceClass(overview.forecastBalance)}`}>{toMonetaryAmount(overview.forecastBalance)}</div>
                                    <div className="text-surface-500 text-sm">Toutes les opérations (validées + à venir)</div>
                                </div>
                            </div>
                        </Card>
                        <Card title="Dépenses" className="h-full flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-1 text-lg font-semibold">
                                Budget global
                                <span className={isGloballyOver ? "text-red-400" : ""}>
                                    {toMonetaryAmount(totalActual)}
                                    {" / "}
                                    {toMonetaryAmount(totalBudget)}
                                    {
                                        isGloballyOver && <i
                                            className="pi pi-exclamation-triangle ml-1"
                                            title="Dépassement du budget"
                                        />
                                    }
                                </span>
                            </div>
                            <ProgressBar
                                value={Math.min(100, totalPct)}
                                displayValueTemplate={() => <span>{totalPct.toFixed(2)}%</span>}
                            />
                            <div className="flex justify-end text-surface-500 text-sm mt-4">
                                {daysRemainingInMonth} jour(s) restant(s)
                            </div>
                        </Card>
                        <MonthlyDashboard accountId={accountId} />
                        <BudgetDetailsByPosteCard
                            budgetData={budgetData}
                        />
                    </div>
                </>)}
        </PageTemplate>
    );
}
