import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import { DashboardOverview } from "../../interfaces/DashboardOverview";
import { ProgressSpinner } from "primereact/progressspinner";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";

export default function Index() {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadOverview = async () => {
            try {
                setLoading(true);
                const data = await new DashboardService().getOverview();
                setOverview(data);
            } finally {
                setLoading(false);
            }
        };

        loadOverview();
    }, []);

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

    return (
        <PageTemplate pageTitle="Dashboard">
            {loading && (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && overview && (
                <div className="grid">
                    <div className="col-12 md:col-4">
                        <Card title="Solde actuel" className="h-full">
                            <div className={`text-4xl font-bold ${getBalanceClass(overview.currentBalance)}`}>
                                {toMonetaryAmount(overview.currentBalance)}
                            </div>
                            <div className="text-500 mt-2">Opérations checkées uniquement</div>
                        </Card>
                    </div>

                    <div className="col-12 md:col-4">
                        <Card title="Solde prévisionnel" className="h-full">
                            <div className={`text-4xl font-bold ${getBalanceClass(overview.forecastBalance)}`}>
                                {toMonetaryAmount(overview.forecastBalance)}
                            </div>
                            <div className="text-500 mt-2">Toutes les opérations (checkées + à venir)</div>
                        </Card>
                    </div>

                    <div className="col-12 md:col-4">
                        <Card title="Dépenses du mois" className="h-full">
                            <div className="text-4xl font-bold text-900">
                                {toMonetaryAmount(overview.monthExpenses)} / {toMonetaryAmount(overview.monthlyBudget)}
                            </div>
                            <div className="mt-3">
                                <div className="w-full surface-200 border-round overflow-hidden" style={{ height: "0.7rem" }}>
                                    <div
                                        className="bg-primary"
                                        style={{ width: `${budgetProgress}%`, height: "100%" }}
                                    />
                                </div>
                            </div>
                            <div className="text-500 mt-2">
                                {budgetProgress.toFixed(1)}% consommé • {overview.daysRemainingInMonth} jour(s) restant(s)
                            </div>
                        </Card>
                    </div>

                    <div className="col-12">
                        <MonthlyDashboard />
                    </div>
                </div>
            )}
        </PageTemplate>
    )
}