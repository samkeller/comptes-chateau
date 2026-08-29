import { useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import type { MonthlyAggregateByPoste } from "@chocosous/shared";
import { ColoredLabel } from "../../../components/datatableBodys/ColoredLabel";
import { toMonetaryAmount } from "../../../utils/NumberUtils";

interface MonthlyPosteTableProps {
    data: MonthlyAggregateByPoste[];
}

interface TableRow {
    posteLabel: string;
    posteColor: string;
    /**
     * Moyenne des totaux mensuels.
     */
    budgetAmount: number | null;
    /**
     * Marque la ligne de total général.
     */
    average: number;
    /**
     * Marque la ligne de total général.
     */
    isTotal: boolean;
    /**
     * Clé dynamique pour les mois, format "YYYY-MM" => valeur du total pour ce mois et ce poste
     */
    monthlyTotals: Record<string, number>;
}

const cx = {
    header: "bg-surface-50 text-xs font-semibold text-surface-600",
    textCell: "py-2",
    amountCell: "text-right whitespace-nowrap",
    total: "bg-surface-100 font-semibold",
};

const DEVIATION_THRESHOLD = 0.2;
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

function getDeviationIcon(value: number, budget: number | null) {
    if (!budget) return null;

    const ratio = Math.abs(value) / budget;
    const title =
        ratio > 1
            ? `${((ratio - 1) * 100).toFixed(0)}% au-dessus du budget`
            : `${((1 - ratio) * 100).toFixed(0)}% en-dessous du budget`;

    if (ratio > 1 + DEVIATION_THRESHOLD) {
        return <i className="pi pi-arrow-up-right text-red-500" title={title} />;
    }

    if (ratio < 1 - DEVIATION_THRESHOLD) {
        return <i className="pi pi-arrow-down-right text-green-500" title={title} />;
    }

    return null;
}

function formatMonthHeader(key: string) {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return (
        <div className="text-right">
            <div>{date.toLocaleDateString("fr-FR", { month: "short" })}</div>
            <div className="text-xs text-surface-500">{year}</div>
        </div>
    );
}

export default function MonthlyPosteTable({ data }: MonthlyPosteTableProps) {
    const { rows, months } = useMemo(() => {
        const months = Array.from(new Set(data.map((d) => monthKey(d.year, d.month)))).sort();
        const monthCount = months.length;

        const budgetMap = new Map<number, number>();
        const posteMap = new Map<number, TableRow>();

        data.forEach((d) => {
            const key = monthKey(d.year, d.month);

            if (d.budgetAmount > 0 && !budgetMap.has(d.posteId)) {
                budgetMap.set(d.posteId, d.budgetAmount);
            }

            if (!posteMap.has(d.posteId)) {
                posteMap.set(d.posteId, {
                    posteLabel: d.posteLabel,
                    posteColor: d.posteColor,
                    budgetAmount: null,
                    average: 0,
                    isTotal: false,
                    monthlyTotals: {},
                });
            }

            const row = posteMap.get(d.posteId)!;
            row.budgetAmount = budgetMap.get(d.posteId) ?? null;
            row.monthlyTotals[key] = d.total;
        });

        const rows = Array.from(posteMap.values()).map((row) => {
            const sum = months.reduce((acc, month) => acc + (row.monthlyTotals[month] ?? 0), 0);
            return { ...row, average: monthCount ? sum / monthCount : 0 };
        });

        const totalMonthlyTotals = Object.fromEntries(
            months.map((month) => [
                month,
                rows.reduce((sum, row) => sum + (row.monthlyTotals[month] ?? 0), 0),
            ])
        );

        const totalBudget = Array.from(budgetMap.values()).reduce((sum, value) => sum + value, 0);
        const totalAverage =
            monthCount > 0
                ? Object.values(totalMonthlyTotals).reduce((sum, value) => sum + value, 0) / monthCount
                : 0;

        rows.push({
            posteLabel: "Total",
            posteColor: "#434343",
            budgetAmount: totalBudget || null,
            average: totalAverage,
            isTotal: true,
            monthlyTotals: totalMonthlyTotals,
        });

        return { rows, months };
    }, [data]);

    const renderAmount = (value: number | undefined, budget: number | null, strong = false) => {
        if (value === undefined) return <span className="text-surface-400">-</span>;

        return (
            <span className={strong ? "font-semibold" : undefined}>
                {toMonetaryAmount(value)} {getDeviationIcon(value, budget)}
            </span>
        );
    };


    return (
        <DataTable
            value={rows}
            size="small"
            scrollable
            scrollHeight="400px"
            showGridlines
            stripedRows
            tableStyle={{ minWidth: "62rem" }}
            rowClassName={(row: TableRow) => (row.isTotal ? cx.total : "")}
            pt={{
                headerRow: { className: "bg-surface-50" }
            }}
        >
            <Column
                field="posteLabel"
                header="Poste"
                body={(row: TableRow) => (
                    <div className={cx.textCell}>
                        {row.isTotal ? (
                            <>
                                <div>{row.posteLabel}</div>
                                {row.budgetAmount !== null && (
                                    <small className="text-surface-500">
                                        Budget cumulé : {toMonetaryAmount(row.budgetAmount)}
                                    </small>
                                )}
                            </>
                        ) : (
                            <>
                                <ColoredLabel data={{ label: row.posteLabel, color: row.posteColor }} />
                                {row.budgetAmount !== null && (
                                    <small className="text-surface-500">
                                        Budget mensuel : {toMonetaryAmount(row.budgetAmount)}
                                    </small>
                                )}
                            </>
                        )}
                    </div>
                )}
                frozen
                alignFrozen="left"
                headerClassName={cx.header}
                style={{ minWidth: "15rem" }}
            />

            {months.map((month) => (
                <Column
                    key={month}
                    field={month}
                    header={formatMonthHeader(month)}
                    body={(row: TableRow) => renderAmount(row.monthlyTotals[month], row.budgetAmount)}
                    headerClassName={cx.header}
                    bodyClassName={cx.amountCell}
                    style={{ minWidth: "8rem" }}
                />
            ))}

            <Column
                field="average"
                header="Moyenne"
                body={(row: TableRow) => renderAmount(row.average, row.budgetAmount, true)}
                headerClassName={cx.header}
                bodyClassName={cx.amountCell}
                style={{ minWidth: "9rem" }}
            />
        </DataTable>
    );
}