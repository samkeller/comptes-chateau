import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useMemo, useState } from "react";
import { UnifiedBudgetLine } from "../../interfaces/BudgetItem";
import BudgetService from "../../services/BudgetService";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { Tag } from "primereact/tag";
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel";

interface UnifiedBudgetViewProps {
    accountId: number;
}

interface GroupedData {
    posteLabel: string;
    posteColor: string | null;
    posteId: number | null;
    lines: UnifiedBudgetLine[];
    subtotal: number;
    percentage: number;
}

export default function UnifiedBudgetView({ accountId }: UnifiedBudgetViewProps) {
    const [lines, setLines] = useState<UnifiedBudgetLine[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setLoading(true);
        new BudgetService()
            .getUnifiedBudget(accountId)
            .then(setLines)
            .finally(() => setLoading(false));
    }, [accountId]);

    const totalBudget = useMemo(() => {
        return lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
    }, [lines]);

    const groupedData = useMemo((): GroupedData[] => {
        const posteMap = new Map<string, UnifiedBudgetLine[]>();

        for (const line of lines) {
            const posteKey = `${line.posteId ?? 'null'}:${line.posteLabel ?? 'Sans poste'}`;
            const current = posteMap.get(posteKey) ?? [];
            current.push(line);
            posteMap.set(posteKey, current);
        }

        return Array.from(posteMap.values())
            .map((posteLines) => {
                const firstLine = posteLines[0]!;
                const subtotal = posteLines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
                const percentage = totalBudget > 0 ? (subtotal / totalBudget) * 100 : 0;

                return {
                    posteLabel: firstLine.posteLabel || "Sans poste",
                    posteColor: firstLine.posteColor,
                    posteId: firstLine.posteId,
                    lines: posteLines,
                    subtotal,
                    percentage,
                };
            })
            .sort((a, b) => a.posteLabel.localeCompare(b.posteLabel));
    }, [lines, totalBudget]);

    const renderSourceBadge = (source: 'budget' | 'recurring') => {
        if (source === 'budget') {
            return <Tag value="Budget" severity="info" />;
        } else {
            return <Tag value="Récurrent" severity="success" />;
        }
    };

    return (
        <>
            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && groupedData.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-border border border-surface bg-surface-50 px-4 py-3">
                        <span className="font-semibold text-surface-700">Budget global</span>
                        <span className="text-xl font-bold text-surface-900">{toMonetaryAmount(totalBudget)}</span>
                    </div>

                    {groupedData.map((posteGroup) => (
                        <section
                            key={`poste-${posteGroup.posteId ?? "none"}-${posteGroup.posteLabel}`}
                            className="overflow-hidden rounded-border border border-surface"
                        >
                            <div className="flex items-center justify-between gap-4 bg-surface-100 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    {posteGroup.posteColor ? (
                                        <ColoredLabel
                                            data={{
                                                label: posteGroup.posteLabel,
                                                color: posteGroup.posteColor,
                                            }}
                                        />
                                    ) : (
                                        <span className="font-semibold text-surface-700">{posteGroup.posteLabel}</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-surface-900">{toMonetaryAmount(posteGroup.subtotal)}</div>
                                    <div className="text-sm text-surface-500">{posteGroup.percentage.toFixed(2)} % du budget</div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
                                    <thead>
                                        <tr className="bg-surface-50">
                                            <th className="text-left p-2 border-b border-surface">Libellé</th>
                                            <th className="text-left p-2 border-b border-surface">Type</th>
                                            <th className="text-right p-2 border-b border-surface">Montant</th>
                                            <th className="text-right p-2 border-b border-surface">Poids</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posteGroup.lines.map((line) => (
                                            <tr key={line.id}>
                                                <td className="p-2 border-b border-surface">{line.label}</td>
                                                <td className="p-2 border-b border-surface">{renderSourceBadge(line.source)}</td>
                                                <td className="text-right p-2 border-b border-surface">{toMonetaryAmount(line.amount)}</td>
                                                <td className="text-right p-2 border-b border-surface">
                                                    {totalBudget > 0 ? `${((line.amount / totalBudget) * 100).toFixed(2)} %` : "0.00 %"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {!loading && groupedData.length === 0 && (
                <div className="text-surface-500">Aucune ligne de budget ou dépense récurrente.</div>
            )}
        </>
    );
}
