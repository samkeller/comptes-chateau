import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import { DashboardOverview } from "../../interfaces/DashboardOverview";
import { ProgressSpinner } from "primereact/progressspinner";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";
import TooltipInfoIcon from "../../components/TooltipInfoIcon";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

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

    const daysRemainingInMonth = useMemo(() => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.getDate() - today.getDate();
    }, []);

    const IndicatorCard = ({
        title,
        value,
        description,
        tooltipText,
        className
    }: {
        title: string;
        value: string;
        description: string,
        tooltipText: string,
        className?: string
    }) => (

        <Card
            title={<span className="flex align-content-center">
                {title}
                <TooltipInfoIcon tooltipText={tooltipText} />
            </span>}
            className="h-full"
        >
            <h2 className={`text-4xl font-bold ${className ?? ""}`} >
                {value}
            </h2>
            <div className="text-500 mt-2">{description}</div>
        </Card>
    )

    return (
        <PageTemplate pageTitle="Dashboard">
            {loading && (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && overview && (
                <div className="grid">
                    <div className="col-12 md:col-6 lg:col-3">
                        <IndicatorCard
                            title="Solde actuel"
                            value={toMonetaryAmount(overview.currentBalance)}
                            description="Opérations validées uniquement"
                            tooltipText="Prend en compte uniquement les opérations 'validées' dont les natures de dépenses sont liées au compte en banque. Représente l'état actuel du compte."
                            className={getBalanceClass(overview.currentBalance)}
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <IndicatorCard
                            title="Solde prévisionnel"
                            value={toMonetaryAmount(overview.forecastBalance)}
                            description="Toutes les opérations (validées + à venir)"
                            tooltipText="Prend en compte uniquement toutes les opérations ('validées' ou non) dont les natures de dépenses sont liées au compte en banque."
                            className={getBalanceClass(overview.forecastBalance)}
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
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
                                {budgetProgress.toFixed(1)}% consommé • {daysRemainingInMonth} jour(s) restant(s)
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Card title="Opérations à vérifier" className="h-full">
                            <div className="text-4xl font-bold text-900">
                                {overview.operationsToCheckInAccountCount}
                                &nbsp; <small className="text-500 text-xl">sur le compte</small>
                            </div>
                            <div className="text-500 mt-2">
                                 {overview.operationsToCheckHorsCompteCount} hors compte
                            </div>
                            <div className="mt-3 w-full flex justify-content-end">
                                <Button
                                    label="Vérifications"
                                    icon="pi pi-arrow-right"
                                    onClick={() => navigate("/comptes/verifications")}
                                />
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