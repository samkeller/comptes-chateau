import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useMemo, useState } from "react";
import type { UnifiedBudgetLine } from "@chocosous/shared";
import BudgetService from "../../../services/BudgetService";
import { useAccountId } from "../../../hooks/useAccountId";
import BudgetDisplayByPoste from "./organisms/BudgetDatatableDisplayByPoste";
import IconSelectButton from "@/components/atoms/form/IconSelectButton";
import { buildBudgetOverviewData } from "./BudgetOverviewCalculations";
import BudgetSummary from "./molecules/BudgetSummary";


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

    const { groupedData, totals } = useMemo(() => buildBudgetOverviewData(lines), [lines]);

    return (
        <>
            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && groupedData.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 rounded-border border border-surface bg-surface-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-48 flex-col gap-1">
                            <span className="font-semibold text-surface-800">Budget global</span>
                            <BudgetSummary totals={totals} />
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

                    {
                        display === "Graph" ? (
                            // <BudgetOverviewGraph data={groupedData} totalBudget={totals.netTotal} />
                            <>{"Jyes"}</>
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
