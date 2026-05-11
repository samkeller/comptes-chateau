import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import { AccountLinePoste } from "../../interfaces/AccountLinePoste";
import { BudgetItem, SaveBudgetItemPayload } from "../../interfaces/BudgetItem";
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel";
import AccountLinePosteService from "../../services/AccountLinePosteService";
import BudgetService from "../../services/BudgetService";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { BooleanIcon } from "@/components/datatableBodys/BooleanIcon";

interface BudgetItemsTableProps {
    accountId: number;
}

interface BudgetDraft {
    label: string;
    amount: number;
    isActive: boolean;
    sortOrder: number;
    posteId: number | null;
}

const emptyDraft: BudgetDraft = {
    label: "",
    amount: 0,
    isActive: true,
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
            label: line.label,
            amount: Number(line.amount ?? 0),
            isActive: line.isActive,
            sortOrder: line.sortOrder,
            posteId: line.poste?.id ?? null,
        });
    };

    const cancelEdit = (): void => {
        setEditingId(null);
        setDraft(emptyDraft);
    };

    const saveDraft = async (): Promise<void> => {
        if (draft.label.trim().length === 0) {
            return;
        }

        const payload: SaveBudgetItemPayload = {
            label: draft.label.trim(),
            amount: Number(draft.amount ?? 0),
            isActive: draft.isActive,
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

    const deleteLine = async (line: BudgetItem): Promise<void> => {
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
        <>
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

            {!loading && (lines.length > 0 || editingId === "new") && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
                        <thead>
                            <tr className="bg-surface-100">
                                <th className="text-left p-2 border border-surface">Poste</th>
                                <th className="text-left p-2 border border-surface">Libellé</th>
                                <th className="text-right p-2 border border-surface">Montant</th>
                                <th className="text-center p-2 border border-surface">Actif</th>
                                <th className="text-right p-2 border border-surface">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editingId === "new" && (
                                <tr>
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
                                    <td className="p-2 border border-surface">
                                        <InputText
                                            value={draft.label}
                                            onChange={(e) => setDraft((previous) => ({ ...previous, label: e.target.value }))}
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
                                    <td className="text-center p-2 border border-surface">
                                        <InputSwitch
                                            checked={draft.isActive}
                                            onChange={(e) => setDraft((previous) => ({ ...previous, isActive: e.value }))}
                                        />
                                    </td>
                                    <td className="text-right p-2 border border-surface">
                                        <div className="flex justify-end gap-2">
                                            <Button icon="pi pi-check" rounded text onClick={() => void saveDraft()} disabled={saving} />
                                            <Button icon="pi pi-times" rounded text severity="secondary" onClick={cancelEdit} disabled={saving} />
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {lines.map((line) => (
                                <tr key={line.id} className={!line.isActive ? "opacity-60" : undefined}>
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
                                            line.poste ? <ColoredLabel data={line.poste} /> : <span className="text-surface-500">Sans poste</span>
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
                                    <td className="text-center p-2 border border-surface">
                                        {editingId === line.id ? (
                                            <InputSwitch
                                                checked={draft.isActive}
                                                onChange={(e) => setDraft((previous) => ({ ...previous, isActive: e.value }))}
                                            />
                                        ) :
                                            <BooleanIcon value={line.isActive} />
                                        }
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
                                                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => void deleteLine(line)} disabled={saving || editingId !== null} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && lines.length === 0 && editingId !== "new" && (
                <div className="text-surface-500">Aucune ligne de budget.</div>
            )}
        </>
    );
}
