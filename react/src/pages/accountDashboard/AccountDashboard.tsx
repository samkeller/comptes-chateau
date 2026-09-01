import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import type { DashboardOverview, BudgetByPoste } from "@chocosous/shared";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";
import { useAccountId } from "../../hooks/useAccountId";
import BudgetDetailsByPosteCard from "./BudgetDetailsByPosteCard";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import DashboardBalanceCard from "./molecules/DashboardBalanceCard";

const dashboardService = new DashboardService();

export default function AccountDashboard() {
    const accountId = useAccountId();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [budgetData, setBudgetData] = useState<BudgetByPoste[]>([]);
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
                        <DashboardBalanceCard
                            overview={overview}
                        />
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
