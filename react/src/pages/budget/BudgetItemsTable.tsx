import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AccountLinePoste } from "../../interfaces/AccountLinePoste";
import { BudgetItem, SaveBudgetItemPayload } from "../../interfaces/BudgetItem";
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel";
import AccountLinePosteService from "../../services/AccountLinePosteService";
import BudgetService from "../../services/BudgetService";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import BudgetCategoryAutoComplete from "./components/BudgetCategoryAutoComplete";

interface BudgetItemsTableProps {
    accountId: number;
}

interface BudgetDraft {
    category: string;
    label: string;
    amount: number;
    sortOrder: number;
    posteId: number | null;
}

const emptyDraft: BudgetDraft = {
    category: "incompressible",
    label: "",
    amount: 0,
    sortOrder: 0,
    posteId: null,
};

export default function BudgetItemsTable({ accountId }: BudgetItemsTableProps) {
    const [lines, setLines] = useState<BudgetItem[]>([]);
    const [postes, setPostes] = useState<AccountLinePoste[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | "new" | null>(null);
    const [draft, setDraft] = useState<BudgetDraft>(emptyDraft);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            new BudgetService().getAccountBudgetItems(accountId),
            new AccountLinePosteService().getAllAccountPostes(accountId),
        ])
            .then(([budgetLines, accountPostes]) => {
                setLines(budgetLines);
                setPostes(accountPostes);
            })
            .finally(() => setLoading(false));
    }, [accountId]);

    const categorySuggestions: string[] = useMemo(() => {
        return Array.from(
            new Set([
                ...lines.map((line) => line.category),
                draft.category,
            ].map((cat) => cat.trim()).filter((cat) => cat.length > 0))
        );
    }, [draft.category, lines]);

    const totalBudget = useMemo(
        () => lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0),
        [lines],
    );

    const groupedRows = useMemo(() => {
        const groupedMap = new Map<string, BudgetItem[]>();
        const noCategoryLabel = "-";

        for (const line of lines) {
            const key = line.category?.trim() || noCategoryLabel;
            const current = groupedMap.get(key) ?? [];
            current.push({ ...line, amount: Number(line.amount ?? 0) });
            groupedMap.set(key, current);
        }

        return Array.from(groupedMap.entries())
            .map(([category, categoryLines]) => {
                const sortedLines = [...categoryLines].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
                const subtotal = sortedLines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
                const percentage = totalBudget > 0 ? (subtotal / totalBudget) * 100 : 0;

                return {
                    category,
                    label: category || noCategoryLabel,
                    lines: sortedLines,
                    subtotal,
                    percentage,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [lines, totalBudget]);

    const refreshBudgetLines = (): Promise<void> => {
        return new BudgetService().getAccountBudgetItems(accountId).then(setLines);
    };

    const startCreate = (): void => {
        const nextSortOrder = lines.reduce((max, line) => Math.max(max, line.sortOrder), 0) + 1;
        setEditingId("new");
        setDraft({ ...emptyDraft, sortOrder: nextSortOrder });
    };

    const startEdit = (line: BudgetItem): void => {
        setEditingId(line.id);
        setDraft({
            category: line.category,
            label: line.label,
            amount: Number(line.amount ?? 0),
            sortOrder: line.sortOrder,
            posteId: line.poste?.id ?? null,
        });
    };

    const cancelEdit = (): void => {
        setEditingId(null);
        setDraft(emptyDraft);
    };

    const saveDraft = async (): Promise<void> => {
        if (draft.label.trim().length === 0 || draft.category.trim().length === 0) {
            return;
        }

        const payload: SaveBudgetItemPayload = {
            category: draft.category.trim(),
            label: draft.label.trim(),
            amount: Number(draft.amount ?? 0),
            sortOrder: Number(draft.sortOrder ?? 0),
            posteId: draft.posteId,
        };

        setSaving(true);
        try {
            const service = new BudgetService();
            if (editingId === "new") {
                await service.createAccountBudgetItem(accountId, payload);
            } else if (typeof editingId === "number") {
                await service.updateAccountBudgetItem(accountId, editingId, payload);
            }

            await refreshBudgetLines();
            cancelEdit();
        } finally {
            setSaving(false);
        }
    };

    const deactivateLine = async (line: BudgetItem): Promise<void> => {
        setSaving(true);
        try {
            await new BudgetService().deleteAccountBudgetItem(accountId, line.id);
            await refreshBudgetLines();
            if (editingId === line.id) {
                cancelEdit();
            }
        } finally {
            setSaving(false);
        }
    };

    const posteOptions = postes.map((poste) => ({ value: poste.id, label: poste.label, color: poste.color }));

    return (
        <Card title="Budget mensuel">
            <div className="flex justify-end mb-3">
                <Button
                    label="Ajouter"
                    icon="pi pi-plus"
                    onClick={startCreate}
                    disabled={saving || loading || editingId !== null}
                />
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && (groupedRows.length > 0 || editingId === "new") && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
                        <thead>
                            <tr className="bg-surface-100">
                                <th className="text-left p-2 border border-surface">Catégorie</th>
                                <th className="text-left p-2 border border-surface">Libellé</th>
                                <th className="text-left p-2 border border-surface">Poste</th>
                                <th className="text-right p-2 border border-surface">Montant</th>
                                <th className="text-right p-2 border border-surface">Poids</th>
                                <th className="text-right p-2 border border-surface">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editingId === "new" && (
                                <tr>
                                    <td className="p-2 border border-surface">
                                        <BudgetCategoryAutoComplete
                                            value={draft.category || ""}
                                            categories={categorySuggestions}
                                            onChange={(value) => setDraft((previous) => ({ ...previous, category: value }))}
                                        />
                                    </td>
                                    <td className="p-2 border border-surface">
                                        <InputText
                                            value={draft.label}
                                            onChange={(e) => setDraft((previous) => ({ ...previous, label: e.target.value }))}
                                            className="w-full"
                                        />
                                    </td>
                                    <td className="p-2 border border-surface">
                                        <Dropdown
                                            value={draft.posteId}
                                            options={posteOptions}
                                            onChange={(e) => setDraft((previous) => ({ ...previous, posteId: (e.value as number | null) ?? null }))}
                                            optionLabel="label"
                                            optionValue="value"
                                            itemTemplate={(option) => option && <ColoredLabel data={option} />}
                                            valueTemplate={(option) => option ? <ColoredLabel data={option} /> : <span>Aucun</span>}
                                            placeholder="Aucun"
                                            showClear
                                            className="w-full"
                                        />
                                    </td>
                                    <td className="p-2 border border-surface text-right">
                                        <InputNumber
                                            value={draft.amount}
                                            onValueChange={(e) => setDraft((previous) => ({ ...previous, amount: e.value ?? 0 }))}
                                            mode="currency"
                                            currency="EUR"
                                            locale="fr-FR"
                                            className="w-full"
                                        />
                                    </td>
                                    <td className="text-right p-2 border border-surface">-</td>
                                    <td className="text-right p-2 border border-surface">
                                        <div className="flex justify-end gap-2">
                                            <Button icon="pi pi-check" rounded text onClick={() => void saveDraft()} disabled={saving} />
                                            <Button icon="pi pi-times" rounded text severity="secondary" onClick={cancelEdit} disabled={saving} />
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {groupedRows.map((group) => (
                                <Fragment key={`group-${group.category}`}>
                                    {group.lines.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-2 border border-surface">
                                                {editingId === line.id ? (
                                                    <BudgetCategoryAutoComplete
                                                        value={draft.category || ""}
                                                        categories={categorySuggestions}
                                                        onChange={(value) => setDraft((previous) => ({ ...previous, category: value }))}
                                                    />
                                                ) : (
                                                    group.label
                                                )}
                                            </td>
                                            <td className="p-2 border border-surface">
                                                {editingId === line.id ? (
                                                    <InputText
                                                        value={draft.label}
                                                        onChange={(e) => setDraft((previous) => ({ ...previous, label: e.target.value }))}
                                                        className="w-full"
                                                    />
                                                ) : line.label}
                                            </td>
                                            <td className="p-2 border border-surface">
                                                {editingId === line.id ? (
                                                    <Dropdown
                                                        value={draft.posteId}
                                                        options={posteOptions}
                                                        onChange={(e) => setDraft((previous) => ({ ...previous, posteId: (e.value as number | null) ?? null }))}
                                                        optionLabel="label"
                                                        optionValue="value"
                                                        itemTemplate={(option) => option && <ColoredLabel data={option} />}
                                                        valueTemplate={(option) => option ? <ColoredLabel data={option} /> : <span>Aucun</span>}
                                                        placeholder="Aucun"
                                                        showClear
                                                        className="w-full"
                                                    />
                                                ) : (
                                                    line.poste ? <ColoredLabel data={line.poste} /> : <span className="text-surface-500">Aucun</span>
                                                )}
                                            </td>
                                            <td className="text-right p-2 border border-surface">
                                                {editingId === line.id ? (
                                                    <InputNumber
                                                        value={draft.amount}
                                                        onValueChange={(e) => setDraft((previous) => ({ ...previous, amount: e.value ?? 0 }))}
                                                        mode="currency"
                                                        currency="EUR"
                                                        locale="fr-FR"
                                                        className="w-full"
                                                    />
                                                ) : toMonetaryAmount(line.amount)}
                                            </td>
                                            <td className="text-right p-2 border border-surface">
                                                {totalBudget > 0
                                                    ? `${((Number(line.amount ?? 0) / totalBudget) * 100).toFixed(2)} %`
                                                    : "0.00 %"}
                                            </td>
                                            <td className="text-right p-2 border border-surface">
                                                {editingId === line.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button icon="pi pi-check" rounded text onClick={() => void saveDraft()} disabled={saving} />
                                                        <Button icon="pi pi-times" rounded text severity="secondary" onClick={cancelEdit} disabled={saving} />
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button icon="pi pi-pencil" rounded text onClick={() => startEdit(line)} disabled={saving || editingId !== null} />
                                                        <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => void deactivateLine(line)} disabled={saving || editingId !== null} />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr key={`subtotal-${group.category}`} className="bg-surface-50">
                                        <td className="p-2 border border-surface font-semibold" colSpan={3}>Sous-total {group.label}</td>
                                        <td className="text-right p-2 border border-surface font-semibold">{toMonetaryAmount(group.subtotal)}</td>
                                        <td className="text-right p-2 border border-surface font-semibold">{group.percentage.toFixed(2)} %</td>
                                        <td className="text-right p-2 border border-surface font-semibold">-</td>
                                    </tr>
                                </Fragment>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-surface-200">
                                <td className="p-2 border border-surface font-bold" colSpan={3}>TOTAL</td>
                                <td className="text-right p-2 border border-surface font-bold">{toMonetaryAmount(totalBudget)}</td>
                                <td className="text-right p-2 border border-surface font-bold">100.00 %</td>
                                <td className="text-right p-2 border border-surface font-bold">-</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {!loading && groupedRows.length === 0 && editingId !== "new" && (
                <div className="text-surface-500">Aucune ligne de budget active.</div>
            )}
        </Card>
    );
}
