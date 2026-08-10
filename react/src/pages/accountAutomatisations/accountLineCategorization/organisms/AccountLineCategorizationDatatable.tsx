import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import AccountLineNatureDropdown from "@/components/atoms/accountLine/AccountLineNatureDropdown";
import AccountLinePosteDropdown from "@/components/atoms/accountLine/AccountLinePosteDropdown";
import AccountLineRule from "@/interfaces/AccountLineRule";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { useMemo, useState } from "react";

interface AccountLineCategorizationDatatableProps {
    accountLineRules: AccountLineRule[];
    onDelete: (id: number) => Promise<void>;
    onUpdate: (
        id: number,
        pattern: string,
        accountId: number,
        posteId?: number | null,
        natureId?: number | null
    ) => Promise<boolean>;
}

interface EditDraft {
    pattern: string;
    posteId: number | null;
    natureId: number | null;
    accountId: number;
}

interface CategorizationTableRow extends AccountLineRule {
    uiEditing: boolean;
    uiPattern: string;
    uiPosteId: number | null;
    uiNatureId: number | null;
    uiAccountId: number;
}

export default function AccountLineCategorizationDatatable({
    accountLineRules,
    onDelete,
    onUpdate,
}: AccountLineCategorizationDatatableProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [draft, setDraft] = useState<EditDraft | null>(null);

    const isEditing = (row: AccountLineRule): boolean => editingId !== null && Number(editingId) === Number(row.id);

    const canSave = useMemo(() => {
        if (!draft) {
            return false;
        }

        return draft.pattern.trim().length > 0 && (draft.posteId !== null || draft.natureId !== null);
    }, [draft]);

    const tableRows = useMemo<CategorizationTableRow[]>(() => {
        return accountLineRules.map((rule) => {
            const rowIsEditing = editingId !== null && Number(editingId) === Number(rule.id) && !!draft;

            if (!rowIsEditing || !draft) {
                return {
                    ...rule,
                    uiEditing: false,
                    uiPattern: rule.pattern,
                    uiPosteId: rule.posteId ?? null,
                    uiNatureId: rule.natureId ?? null,
                    uiAccountId: rule.accountId,
                };
            }

            return {
                ...rule,
                uiEditing: true,
                uiPattern: draft.pattern,
                uiPosteId: draft.posteId,
                uiNatureId: draft.natureId,
                uiAccountId: draft.accountId,
            };
        });
    }, [accountLineRules, editingId, draft]);

    const startEdit = (rule: AccountLineRule) => {
        setEditingId(rule.id);
        setDraft({
            pattern: rule.pattern,
            accountId: rule.accountId,
            posteId: rule.posteId ?? null,
            natureId: rule.natureId ?? null,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
    };

    const saveEdit = async () => {
        if (!draft || editingId === null || !canSave) {
            return;
        }

        setIsSaving(true);
        try {
            const didSave = await onUpdate(
                editingId,
                draft.pattern,
                draft.accountId,
                draft.posteId,
                draft.natureId,
            );

            if (didSave) {
                cancelEdit();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (rule: AccountLineRule) => {
        confirmDialog({
            header: "Supprimer la règle",
            message: `La règle "${rule.pattern}" sera supprimée. Continuer ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                await onDelete(rule.id);
            },
        });
    };

    return (
        <Card title="Déjà matchés">
            <ConfirmDialog />
            <DataTable
                key={editingId === null ? "categorization-view" : `categorization-edit-${editingId}`}
                value={tableRows}
                dataKey="id"
                cellMemo
                paginator
                rows={20}
                rowsPerPageOptions={[10, 20, 50]}
                size="small"
            >
                <Column
                    field="pattern"
                    header="Pattern"
                    body={(rowData: CategorizationTableRow) => {
                        if (!rowData.uiEditing || !draft) {
                            return rowData.pattern;
                        }

                        return (
                            <InputText
                                value={rowData.uiPattern}
                                onChange={(event) => setDraft((previous) => previous ? {
                                    ...previous,
                                    pattern: event.target.value,
                                } : previous)}
                                className="w-full"
                                autoFocus
                            />
                        );
                    }}
                />
                <Column
                    field="poste"
                    header="Poste"
                    body={(rowData: CategorizationTableRow) => {
                        if (!rowData.uiEditing || !draft) {
                            return rowData.poste ? <ColoredLabel data={{ label: rowData.poste.label, color: rowData.poste.color }} /> : null;
                        }

                        return (
                            <AccountLinePosteDropdown
                                accountId={rowData.uiAccountId}
                                value={rowData.uiPosteId}
                                onChange={(event) => setDraft((previous) => previous ? {
                                    ...previous,
                                    posteId: (event.value as number | null) ?? null,
                                } : previous)}
                                showClear
                                showNullOption
                                className="w-full"
                            />
                        );
                    }}
                ></Column>
                <Column
                    field="nature"
                    header="Nature"
                    body={(rowData: CategorizationTableRow) => {
                        if (!rowData.uiEditing || !draft) {
                            return rowData.nature ? <ColoredLabel data={{ label: rowData.nature.label, color: rowData.nature.color }} /> : null;
                        }

                        return (
                            <AccountLineNatureDropdown
                                value={rowData.uiNatureId}
                                onChange={(event) => setDraft((previous) => previous ? {
                                    ...previous,
                                    natureId: (event.value as number | null) ?? null,
                                } : previous)}
                                showClear
                                showNullOption
                                className="w-full"
                            />
                        );
                    }}
                ></Column>
                <Column field="occurrencesCount" header="Occurences"></Column>
                <Column
                    header="Actions"
                    body={(row: AccountLineRule) =>
                        <div className="flex gap-1 justify-end">
                            {isEditing(row) ? (
                                <>
                                    <Button
                                        icon="pi pi-check"
                                        text
                                        rounded
                                        className="p-button-sm"
                                        onClick={() => void saveEdit()}
                                        disabled={!canSave || isSaving}
                                        tooltip="Valider"
                                        tooltipOptions={{ position: "left" }}
                                    />
                                    <Button
                                        icon="pi pi-times"
                                        text
                                        rounded
                                        severity="secondary"
                                        className="p-button-sm"
                                        onClick={cancelEdit}
                                        disabled={isSaving}
                                        tooltip="Annuler"
                                        tooltipOptions={{ position: "left" }}
                                    />
                                </>
                            ) : (
                                <>
                                    <Button
                                        icon="pi pi-pencil"
                                        text
                                        rounded
                                        className="p-button-sm"
                                        onClick={() => startEdit(row)}
                                        disabled={editingId !== null}
                                        tooltip="Modifier"
                                        tooltipOptions={{ position: "left" }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        text
                                        rounded
                                        severity="danger"
                                        className="p-button-sm"
                                        onClick={() => requestDelete(row)}
                                        disabled={editingId !== null}
                                        tooltip="Supprimer"
                                        tooltipOptions={{ position: "left" }}
                                    />
                                </>
                            )}
                        </div>
                    }
                />
            </DataTable>
        </Card>
    );
}
