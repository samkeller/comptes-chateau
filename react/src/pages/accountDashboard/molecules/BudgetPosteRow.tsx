import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import type { BudgetByPoste } from "@chocosous/shared";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import { ProgressBar } from "primereact/progressbar";


interface BudgetPosteRowProps {
    row: BudgetByPoste;
}

export default function BudgetPosteRow({ row }: BudgetPosteRowProps) {
    const { posteLabel, posteColor, budgetAmount, actualAmount } = row;

    /**
     * Calcul du pourcentage de consommation du budget pour ce poste.
     *      Si le budget est à 0 dépenses => 100%
     *      Si le budget est à 0 et pas de dépenses => 0%
     */
    const percentage = budgetAmount > 0 ?
        (actualAmount / budgetAmount) * 100 :
        (actualAmount > 0 ? 100 : 0);

    const isOverBudget = actualAmount > budgetAmount && budgetAmount > 0;

    const hasBudget = budgetAmount > 0;

    const overBudgetClass = isOverBudget ? "text-red-400" : "";
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <div className="flex items-center gap-2">
                    <ColoredLabel data={{ color: posteColor, label: posteLabel }} />
                </div>
                <span className={overBudgetClass}>
                    {toMonetaryAmount(actualAmount)}
                    {" / "}
                    {hasBudget ? toMonetaryAmount(budgetAmount) : "- "}
                    {
                        isOverBudget && <i
                            className="pi pi-exclamation-triangle ml-1"
                            title="Dépassement du budget"
                        />
                    }
                </span>
            </div>
            {
                hasBudget && (
                    <div className="flex items-center gap-2">
                        <div className="grow">
                            <ProgressBar
                                value={Math.min(100, percentage)}
                                displayValueTemplate={() => null}
                                className="h-3"
                                pt={{
                                    value: { style: { backgroundColor: posteColor } }
                                }}
                            />
                        </div>
                        <span className={overBudgetClass}>{percentage.toFixed(1)}%</span>
                    </div>
                )
            }
        </div>
    );
}