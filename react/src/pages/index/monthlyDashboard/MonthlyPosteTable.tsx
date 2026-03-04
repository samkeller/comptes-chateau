import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MonthlyAggregateByPoste } from "../../../interfaces/MonthlyAggregateByPoste";
import { useMemo } from "react";
import { ColoredLabel } from "../../../components/datatableBodys/ColoredLabel";
import { toMonetaryAmount } from "../../../utils/NumberUtils";

interface MonthlyPosteTableProps {
    data: MonthlyAggregateByPoste[];
}

interface TableRow {
    posteLabel: string;
    posteColor: string;
    [key: string]: string | number; // mois dynamiques (ex: "2025-01": 123.45)
}

export default function MonthlyPosteTable({ data }: MonthlyPosteTableProps) {
    const { rows, months } = useMemo(() => {
        // Extraction des mois uniques
        const monthsSet = new Set<string>();
        data.forEach((d) => {
            const key = `${d.year}-${d.month.toString().padStart(2, "0")}`;
            monthsSet.add(key);
        });
        const sortedMonths = Array.from(monthsSet).sort();

        // Construction des lignes par poste
        const posteMap = new Map<string, TableRow>();
        data.forEach((d) => {
            const monthKey = `${d.year}-${d.month.toString().padStart(2, "0")}`;
            if (!posteMap.has(d.posteLabel)) {
                posteMap.set(d.posteLabel, {
                    posteLabel: d.posteLabel,
                    posteColor: d.posteColor,
                });
            }
            const row = posteMap.get(d.posteLabel)!;
            row[monthKey] = d.total;
        });

        // Calcul des totaux par mois
        const totalRow: TableRow = {
            posteLabel: "Total",
            posteColor: "#434343",
        };
        sortedMonths.forEach((month) => {
            let sum = 0;
            posteMap.forEach((row) => {
                sum += (row[month] as number) || 0;
            });
            totalRow[month] = sum;
        });

        const finalRows = [...Array.from(posteMap.values()), totalRow];

        return { rows: finalRows, months: sortedMonths };
    }, [data]);

    const currencyBody = (row: TableRow, month: string) => {
        const value = row[month] as number;
        if (!value) return;
        return toMonetaryAmount(value);
    };

    return (
        <DataTable
            value={rows}
            size="small"
            scrollable
            scrollHeight="400px"
        >
            <Column
                field="posteLabel"
                header="Poste"
                body={v => <ColoredLabel data={{ label: v.posteLabel, color: v.posteColor }} />}
                frozen
                alignFrozen="left"
            />

            {months.map((month) => (
                <Column
                    key={month}
                    field={month}
                    header={month}
                    body={(row) => currencyBody(row, month)}
                    style={{ textAlign: "right" }}
                />
            ))}
        </DataTable>
    );
}
