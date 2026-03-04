import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Fragment } from "react";
import { useEffect, useMemo, useState } from "react";
import { BudgetCategory, BudgetItem } from "../../interfaces/BudgetItem";
import BudgetService from "../../services/BudgetService";
import { toMonetaryAmount } from "../../utils/NumberUtils";

const categoryLabel: Record<BudgetCategory, string> = {
    incompressible: "Incompressible",
    compressible: "Compressible",
    epargne: "Epargne"
};

export default function BudgetItemsTable() {
    const [lines, setLines] = useState<BudgetItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await new BudgetService().getBudgetItems();
                setLines(data);
            } catch (err) {
                console.error("Erreur de chargement du budget:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const totalBudget = useMemo(() => {
        if (!Array.isArray(lines)) {
            return 0;
        }
        return lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
    }, [lines]);

    const groupedRows = useMemo(() => {
        const categories: BudgetCategory[] = ["incompressible", "compressible", "epargne"];

        return categories
            .map((category) => {
                const categoryLines = lines
                    .filter((line) => line.category === category)
                    .map((line) => ({ ...line, amount: Number(line.amount ?? 0) }))
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                const subtotal = categoryLines.reduce((sum, line) => sum + line.amount, 0);
                const percentage = totalBudget > 0 ? (subtotal / totalBudget) * 100 : 0;

                return {
                    category,
                    label: categoryLabel[category],
                    lines: categoryLines,
                    subtotal,
                    percentage
                };
            })
            .filter((group) => group.lines.length > 0);
    }, [lines, totalBudget]);

    return (
        <Card title="Budget mensuel">
            {loading && (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && groupedRows.length > 0 && (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{borderSpacing: 0}}>
                            <thead>
                                <tr className="surface-100">
                                    <th className="text-left p-2 border-1 surface-border">Catégorie</th>
                                    <th className="text-left p-2 border-1 surface-border">Libellé</th>
                                    <th className="text-right p-2 border-1 surface-border">Montant</th>
                                    <th className="text-right p-2 border-1 surface-border">Poids</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedRows.map((group) => (
                                    <Fragment key={`group-${group.category}`}>
                                        {group.lines.map((line, index) => (
                                            <tr key={line.id}>
                                                {index === 0 && (
                                                    <td rowSpan={group.lines.length + 1} className="border-1 surface-border font-semibold align-top">
                                                        {group.label}
                                                    </td>
                                                )}
                                                <td className="p-2 border-1 surface-border">{line.label}</td>
                                                <td className="text-right p-2 border-1 surface-border">{toMonetaryAmount(line.amount)}</td>
                                                <td className="text-right p-2 border-1 surface-border">
                                                    {`${((line.amount / totalBudget) * 100).toFixed(2)} %`}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr key={`subtotal-${group.category}`} className="surface-50 p-0">
                                            <td className="p-2 border-1 surface-border font-semibold">Sous-total</td>
                                            <td className="text-right p-2 border-1 surface-border font-semibold">{toMonetaryAmount(group.subtotal)}</td>
                                            <td className="text-right p-2 border-1 surface-border font-semibold">{group.percentage.toFixed(2)} %</td>
                                        </tr>
                                    </Fragment>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="surface-200 p-0">
                                    <td className="p-2 border-1 surface-border font-bold" colSpan={2}>TOTAL</td>
                                    <td className="text-right p-2 border-1 surface-border font-bold">{toMonetaryAmount(totalBudget)}</td>
                                    <td className="text-right p-2 border-1 surface-border font-bold">100.00 %</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </Card>
    );
}
