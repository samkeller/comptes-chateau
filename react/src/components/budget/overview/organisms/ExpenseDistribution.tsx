import type { GroupedBudgetData } from "@/pages/budget/budgetOverview/BudgetOverviewCalculations";
import { useState, useRef } from "react";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import AppScrollPanel from "@/components/atoms/primereact/AppScrollPanel";
import GroupedBudgetDataDisplay from "../molecules/GroupedBudgetDataDisplay";
import BudgetDonut from "@/pages/budget/budgetOverview/atoms/BudgetDonut";

interface ExpenseDistributionProps {
    datas: GroupedBudgetData[];
}

export default function ExpenseDistribution({ datas }: ExpenseDistributionProps) {
    const [highlightPoste, setHighlightPoste] = useState<number | null>(null);
    /**
     * Stocke les références des éléments de chaque groupe de budget.
     */
    const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

    /**
     * Au clic sur un poste, le met en surbrillance et fait défiler jusqu'à lui.
     * @param posteId 
     * @returns 
     */
    function onClickPoste(posteId: number | null) {
        if (posteId === null) {
            return;
        }

        setHighlightPoste(posteId);

        const element = groupRefs.current[String(posteId)];

        element?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }


    return (
        <div>
            <h2 className="mb-3">Répartition des dépenses</h2>
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                {/* GAUCHE */}
                <div className="flex min-w-0 justify-center">
                    <BudgetDonut
                        datas={datas}
                        onHoverPoste={(posteId) => setHighlightPoste(posteId)}
                        onClickPoste={onClickPoste}
                    />
                </div>
                {/* DROITE */}
                <FillRemainingHeight offset={70}>
                    <AppScrollPanel
                        direction="vertical"
                    >
                        <div className="flex flex-col gap-4 pr-2">
                            {datas.map((data) => {
                                const key = String(data.posteId ?? "none");
                                return (
                                    <div
                                        key={`${data.posteId ?? "none"}-${data.posteLabel}`}
                                        ref={(element) => { groupRefs.current[key] = element; }}
                                    >
                                        <GroupedBudgetDataDisplay
                                            groupBudget={data}
                                            isHighlighted={highlightPoste === data.posteId}
                                        />
                                    </div>
                                )
                            }
                            )}
                        </div>
                    </AppScrollPanel>
                </FillRemainingHeight>
            </div>
        </div>
    );
}