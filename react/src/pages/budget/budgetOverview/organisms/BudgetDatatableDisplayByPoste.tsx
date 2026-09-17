import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel"
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import type { UnifiedBudgetLine } from "@chocosous/shared";
import { getBudgetLineWeight, type GroupedBudgetData } from "../BudgetOverviewCalculations"
import { toMonetaryAmount } from "@/utils/NumberUtils";

interface BudgetDatatableDisplayByPosteProps {
    data: GroupedBudgetData
}

export default function BudgetDatatableDisplayByPoste({ data }: BudgetDatatableDisplayByPosteProps) {

    return (
        <section
            key={`poste-${data.posteId ?? "none"}-${data.posteLabel}`}
            className="overflow-hidden rounded-border border border-surface"
        >
            <div className="flex items-center justify-between gap-4 bg-surface-100 px-4 py-3">
                <div className="min-w-0">
                    {data.posteColor ? (
                        <ColoredLabel
                            data={{
                                label: data.posteLabel,
                                color: data.posteColor,
                            }}
                        />
                    ) : (
                        <span className="font-semibold text-surface-700">{data.posteLabel}</span>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-surface-500">
                        {data.creditTotal !== 0 && (
                            <span>
                                {"Recettes "}
                                <span className="font-medium text-surface-700">{toMonetaryAmount(data.creditTotal)}</span>{" "}
                                <span className="text-surface-400">({data.creditSharePercentage.toFixed(1)} % du total)</span>
                            </span>
                        )}

                        {data.debitTotal !== 0 && (
                            <span>
                                {" "}
                                <span className="font-medium text-surface-700">{toMonetaryAmount(data.debitTotal)}</span>{" "}
                                <span className="text-surface-400">({data.debitSharePercentage.toFixed(1)} % du total)</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="shrink-0 font-semibold text-surface-800">{toMonetaryAmount(data.netTotal)}</div>
            </div>

            <DataTable value={data.lines} size="small" stripedRows>
                <Column
                    style={{ width: "10%" }}
                    field="source"
                    header="Type"
                    body={(rowData) => (
                        rowData.source === 'budget' ?
                            <Tag className="w-24" value="Budget" severity="info" /> :
                            <Tag className="w-24" value="Récurrent" severity="success" />
                    )} />
                <Column
                    style={{ width: "30%" }}
                    field="label"
                    header="Libellé"
                />
                <Column
                    style={{ width: "15%" }}
                    field="debit"
                    header="Débit"
                    align="right"
                    body={(rowData: UnifiedBudgetLine) => rowData.debit > 0 ? toMonetaryAmount(rowData.debit) : ""}
                />
                <Column
                    style={{ width: "15%" }}
                    field="credit"
                    header="Crédit"
                    align="right"
                    body={(rowData: UnifiedBudgetLine) => rowData.credit > 0 ? toMonetaryAmount(rowData.credit) : ""}
                />
                <Column
                    style={{ width: "10%" }}
                    field="amount"
                    header="Solde"
                    align="right"
                    body={(rowData: UnifiedBudgetLine) => toMonetaryAmount(rowData.amount)}
                />
                <Column
                    style={{ width: "20%" }}
                    field="amount"
                    header="Poids poste"
                    align="right"
                    body={(rowData: UnifiedBudgetLine) => `${getBudgetLineWeight(rowData, data).toFixed(2)} %`}
                />
            </DataTable>
        </section>
    )
}