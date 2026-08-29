import { Card } from "primereact/card";
import { useEffect, useState } from "react";
import DashboardService from "../../../services/DashboardService";
import type { MonthlyAggregateByPoste } from "@chocosous/shared";
import MonthlyPosteChart from "./MonthlyPosteChart";
import { ProgressSpinner } from "primereact/progressspinner";
import { MultiSelect } from "primereact/multiselect";
import { AccountLinePoste } from "../../../interfaces/AccountLinePoste";
import { ColoredLabel } from "../../../components/datatableBodys/ColoredLabel";
import { FloatLabel } from "primereact/floatlabel";
import { Calendar } from "primereact/calendar";
import MonthlyPosteTable from "./MonthlyPosteTable";
import { TabPanel, TabView } from "primereact/tabview";
import AccountLinePosteService from "../../../services/AccountLinePosteService";

interface MonthlyDashboardProps {
    accountId: number;
}

export default function MonthlyDashboard({ accountId }: MonthlyDashboardProps) {
    const [dashboardData, setDashboardData] = useState<MonthlyAggregateByPoste[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [postes, setPostes] = useState<AccountLinePoste[]>([]);
    const [selectedPostes, setSelectedPostes] = useState<AccountLinePoste[]>([]);
    const [tabActiveIndex, setTabActiveIndex] = useState<number>(0);

    const [dateRange, setDateRange] = useState<(Date | null)[]>(() => {
        // Calcul de la période : 12 derniers mois
        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 11); // 12 mois incluant le mois courant

        return [fromDate, now];
    });

    useEffect(() => {
        loadDashboardData();
        new AccountLinePosteService().getAllAccountPostes(accountId)
            .then((postes) => {
                setPostes(postes);
                setSelectedPostes(postes); // Par défaut, tous les postes sont sélectionnés
            })
    }, [accountId]);

    useEffect(() => {
        loadDashboardData();
    }, [dateRange, selectedPostes]);

    const loadDashboardData = (): void => {
        if (!dateRange[0] || !dateRange[1]) return;

        setLoading(true);

        if (selectedPostes.length === 0) {
            setDashboardData([]);
            setLoading(false);
            return;
        }

        const service = new DashboardService();
        service
            .getAccountMonthlyByPoste(
                accountId,
                dateRange[0],
                dateRange[1],
                selectedPostes.map((poste) => poste.id),
            )
            .then(setDashboardData)
            .finally(() => {
                setLoading(false);
            });
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
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}
            {!loading && dashboardData.length > 0 && (
                <div className="flex flex-col gap-12">
                    <TabView activeIndex={tabActiveIndex} onTabChange={(e) => setTabActiveIndex(e.index)}>
                        <TabPanel header="Graphique">
                            <MonthlyPosteChart data={dashboardData} />
                        </TabPanel>
                        <TabPanel header="Tableau">
                            <MonthlyPosteTable data={dashboardData} />
                        </TabPanel>
                    </TabView>
                </div>
            )}
        </Card>
    );
}