import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useMemo, useState } from "react";
import type { UnifiedBudgetLine } from "@chocosous/shared";
import BudgetService from "../../../services/BudgetService";
import { useAccountId } from "../../../hooks/useAccountId";
import BudgetDisplayByPoste from "./organisms/BudgetDatatableDisplayByPoste";
import IconSelectButton from "@/components/atoms/form/IconSelectButton";
import { buildBudgetOverviewData } from "./BudgetOverviewCalculations";
import BudgetDashboardView from "@/components/budget/overview/organisms/BudgetDashboardView";


export default function BudgetOverview() {
    const accountId = useAccountId();
    const [lines, setLines] = useState<UnifiedBudgetLine[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [display, setDisplay] = useState<"Graph" | "List">("Graph");

    useEffect(() => {
        setLoading(true);
        new BudgetService()
            .getUnifiedBudget(accountId)
            .then(setLines)
            .finally(() => setLoading(false));
    }, [accountId]);

    const { groupedData } = useMemo(() => buildBudgetOverviewData(lines), [lines]);

    return (
        <>
            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && groupedData.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-700/80 bg-slate-800/50 px-3 py-3 sm:px-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="font-semibold text-slate-100">
                                    Budget global
                                </span>
                            </div>
                            <IconSelectButton
                                options={[
                                    { value: "Graph", icon: "pi pi-chart-bar" },
                                    { value: "List", icon: "pi pi-list" },
                                ]}
                                defaultValue={"Graph"}
                                onSelected={(selected) => setDisplay(selected as "Graph" | "List")}
                            />
                        </div>

                    </div>
                    {
                        display === "Graph" ? (
                            <BudgetDashboardView datas={groupedData} />
                        ) :
                            groupedData.map((posteGroup) => <BudgetDisplayByPoste key={`poste-${posteGroup.posteId ?? "none"}-${posteGroup.posteLabel}`} data={posteGroup} />)
                    }
                </div>
            )}

            {!loading && groupedData.length === 0 && (
                <div className="text-surface-500">Aucune ligne de budget ou dépense récurrente.</div>
            )}
        </>
    );
}
