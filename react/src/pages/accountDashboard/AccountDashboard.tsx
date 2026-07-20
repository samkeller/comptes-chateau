import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import { DashboardOverview } from "../../interfaces/DashboardOverview";
import { ProgressSpinner } from "primereact/progressspinner";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";
import TooltipInfoIcon from "../../components/TooltipInfoIcon";
import { Divider } from "primereact/divider";
import { useAccountId } from "../../hooks/useAccountId";
import BudgetDetailsByPosteCard from "./BudgetDetailsByPosteCard";
import { ProgressBar } from "primereact/progressbar";
import { BudgetByPoste } from "@/interfaces/BudgetByPoste";
import { useScreen } from "@/utils/hooks/useScreen";

export default function AccountDashboard() {
    const accountId = useAccountId();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [budgetData, setBudget] = useState<BudgetByPoste[]>([]);
    const { isMobile } = useScreen();

    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadOverview = async () => {
            try {
                setLoading(true);
                const dashboardService = new DashboardService();
                const [overviewData, budgetData] = await Promise.all([
                    dashboardService.getAccountOverview(accountId),
                    dashboardService.getBudgetByPoste(accountId)
                ]);
                setOverview(overviewData);
                setBudget(budgetData);
            } finally {
                setLoading(false);
            }
        };

        loadOverview();
    }, [accountId]);


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


    return (
        <PageTemplate pageTitle="Dashboard">
            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}
            {!loading && overview && (
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
                    <BudgetDetailsByPosteCard budgetData={budgetData} />
                </div>
            )}
        </PageTemplate>
    );
}
