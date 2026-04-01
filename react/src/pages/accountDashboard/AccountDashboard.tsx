import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import { DashboardOverview } from "../../interfaces/DashboardOverview";
import { ProgressSpinner } from "primereact/progressspinner";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "../index/monthlyDashboard/MonthlyDashboard";
import TooltipInfoIcon from "../../components/TooltipInfoIcon";
import { Divider } from "primereact/divider";
import { useAccountId } from "../../hooks/useAccountId";

export default function AccountDashboard() {
    const accountId = useAccountId();
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadOverview = async () => {
            try {
                setLoading(true);
                const data = await new DashboardService().getAccountOverview(accountId);
                setOverview(data);
            } finally {
                setLoading(false);
            }
        };

        loadOverview();
    }, [accountId]);

    const budgetProgress = useMemo(() => {
        if (!overview || overview.monthlyBudget <= 0) {
            return 0;
        }
        return Math.min(100, (overview.monthExpenses / overview.monthlyBudget) * 100);
    }, [overview]);

    const getBalanceClass = (value: number): string => {
        if (value < 0) return "text-red-500";
        if (value <= 100) return "text-orange-500";
        return "text-green-500";
    };

    const daysRemainingInMonth = useMemo(() => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.getDate() - today.getDate();
    }, []);

    return (
        <PageTemplate pageTitle="Dashboard">
            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && overview && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Solde" className="h-full">
                            <div className="flex h-full">
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">Actuel</span>
                                        <TooltipInfoIcon tooltipText="Prend en compte uniquement les opérations 'validées' dont les natures de dépenses sont liées au compte en banque. Représente l'état actuel du compte." />
                                    </div>
                                    <div className={`text-3xl font-bold ${getBalanceClass(overview.currentBalance)}`}>{toMonetaryAmount(overview.currentBalance)}</div>
                                    <div className="text-surface-500 text-sm">Opérations validées uniquement</div>
                                </div>
                                <Divider layout="vertical" className="shrink" />
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
                        <Card title="Dépenses du mois" className="h-full flex flex-col justify-between">
                            <div className="text-3xl font-bold text-surface-900">
                                {toMonetaryAmount(overview.monthExpenses)} / {toMonetaryAmount(overview.monthlyBudget)}
                            </div>
                            <div className="mt-6">
                                <div className="w-full bg-surface-200 rounded-border overflow-hidden" style={{ height: "0.7rem" }}>
                                    <div className="bg-primary text-primary-contrast" style={{ width: `${budgetProgress}%`, height: "100%" }} />
                                </div>
                            </div>
                            <div className="text-surface-500 mt-2">
                                {budgetProgress.toFixed(1)}% consommé • {daysRemainingInMonth} jour(s) restant(s)
                            </div>
                        </Card>
                    </div>
                    <MonthlyDashboard accountId={accountId} />
                </div>
            )}
        </PageTemplate>
    );
}
