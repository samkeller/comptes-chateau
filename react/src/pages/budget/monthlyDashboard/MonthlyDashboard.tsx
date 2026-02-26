import { Card } from "primereact/card";
import { useEffect, useState } from "react";
import DashboardService from "../../../services/DashboardService";
import { MonthlyAggregateByPoste } from "../../../interfaces/MonthlyAggregateByPoste";
import MonthlyPosteChart from "./MonthlyPosteChart";
import { ProgressSpinner } from "primereact/progressspinner";
import { MultiSelect } from "primereact/multiselect";
import { AccountLinePoste } from "../../../interfaces/AccountLinePoste";
import AccountingService from "../../../services/AccountingService";
import { ColoredLabel } from "../../../components/datatableBodys/ColoredLabel";
import { FloatLabel } from "primereact/floatlabel";
import { Calendar } from "primereact/calendar";
import MonthlyPosteTable from "./MonthlyPosteTable";

export default function MonthlyDashboard() {
    const [dashboardData, setDashboardData] = useState<MonthlyAggregateByPoste[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [postes, setPostes] = useState<AccountLinePoste[]>([]);
    const [selectedPostes, setSelectedPostes] = useState<AccountLinePoste[]>([]);

    const [dateRange, setDateRange] = useState<(Date | null)[]>(() => {
        // Calcul de la période : 12 derniers mois
        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 11); // 12 mois incluant le mois courant

        return [fromDate, now];
    });

    useEffect(() => {
        loadDashboardData();
        // Charger la liste des postes pour le filtre
        new AccountingService().getAllPostes().then(postes => {
            setPostes(postes);
            setSelectedPostes(postes); // Par défaut, tous les postes sont sélectionnés
        });
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [dateRange, selectedPostes]);

    const loadDashboardData = async () => {
        if (!dateRange[0] || !dateRange[1]) return;

        try {
            setLoading(true);

            if (selectedPostes.length === 0) {
                setDashboardData([]);
                return;
            }

            const service = new DashboardService();
            const data = await service.getMonthlyByPoste(
                dateRange[0],
                dateRange[1],
                selectedPostes.map((poste) => poste.id)
            );
            setDashboardData(data);
        } catch (err) {
            console.error("Erreur lors du chargement du dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="flex-1 min-w-0" title="Statistiques mensuelles par poste">
            <div className="flex gap-2 min-w-0">
                <FloatLabel className="flex-1 min-w-0">
                    <Calendar
                        value={dateRange}
                        onChange={e => e.value && setDateRange(e.value)}
                        view="month"
                        selectionMode="range"
                    />
                    <label>Bornes</label>
                </FloatLabel>
                <FloatLabel className="flex-1 min-w-0">
                    <MultiSelect
                        className="w-full"
                        options={postes}
                        value={selectedPostes}
                        onChange={v => setSelectedPostes(v.value)}
                        itemTemplate={v => v && <ColoredLabel data={v} />}
                        selectedItemTemplate={v => v && <ColoredLabel data={v} />}
                        placeholder="Aucun"
                        maxSelectedLabels={3}
                    />
                    <label>Postes</label>
                </FloatLabel>
            </div>

            {loading && (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner />
                </div>
            )}
            {!loading && dashboardData.length > 0 && (
                <div className="flex flex-column gap-4">
                    <MonthlyPosteChart data={dashboardData} />
                    <MonthlyPosteTable data={dashboardData} />
                </div>
            )}
        </Card>
    );
}