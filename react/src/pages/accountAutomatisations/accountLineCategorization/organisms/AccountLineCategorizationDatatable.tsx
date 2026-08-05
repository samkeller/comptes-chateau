import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import AccountLineRule from "@/interfaces/AccountLineRule";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useState } from "react";

interface AccountLineCategorizationDatatableProps {
    accountLineRules: AccountLineRule[];
    /** Optional handler called when a rule should be deleted. If omitted, delete is disabled. */
    onDelete?: (id: number) => Promise<void>;
    /** Optional handler called when a rule should be updated. If omitted, inline edit is disabled. */
    onUpdate?: (id: number, payload: { pattern?: string; posteId?: number | null; natureId?: number | null }) => Promise<void>;
}

export default function AccountLineCategorizationDatatable({ accountLineRules, onDelete, onUpdate }: AccountLineCategorizationDatatableProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draftById, setDraftById] = useState<Record<number, { pattern: string }>>({});
    const [busyIds, setBusyIds] = useState<Record<number, boolean>>({});

    const startEdit = (r: AccountLineRule) => {
        setDraftById((p) => ({ ...p, [r.id]: { pattern: r.pattern } }));
        setEditingId(r.id);
    };

    const cancelEdit = (id: number) => {
        setEditingId((cur) => (cur === id ? null : cur));
        setDraftById((p) => {
            const next = { ...p };
            delete next[id];
            return next;
        });
    };

    const saveEdit = async (id: number) => {
        if (!onUpdate) return;
        const draft = draftById[id];
        if (!draft) return;

        setBusyIds((p) => ({ ...p, [id]: true }));
        try {
            await onUpdate(id, { pattern: draft.pattern.trim() });
            cancelEdit(id);
        } finally {
            setBusyIds((p) => {
                const next = { ...p };
                delete next[id];
                return next;
            });
        }
    };

    const requestDelete = (r: AccountLineRule) => {
        if (!onDelete) return;
        confirmDialog({
            header: "Supprimer la règle",
            message: `La règle "${r.pattern}" sera supprimée. Continuer ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setBusyIds((p) => ({ ...p, [r.id]: true }));
                try {
                    await onDelete!(r.id);
                } finally {
                    setBusyIds((p) => {
                        const next = { ...p };
                        delete next[r.id];
                        return next;
                    });
                }
            }
        });
    };

    return (
        <Card title="Déjà matchés">
            <ConfirmDialog />
            <DataTable
                value={accountLineRules}
            >
                <Column
                    field="pattern"
                    header="Pattern"
                    body={(rowData: AccountLineRule) => {
                        if (editingId === rowData.id) {
                            const draft = draftById[rowData.id] ?? { pattern: rowData.pattern };
                            return (
                                <InputText
                                    value={draft.pattern}
                                    onChange={(e) => setDraftById((p) => ({ ...p, [rowData.id]: { pattern: e.target.value } }))}
                                    className="w-full"
                                />
                            );
                        }

                        return rowData.pattern;
                    }}
                ></Column>
                <Column
                    field="poste"
                    header="Poste"
                    body={(rowData: AccountLineRule) => rowData.poste && <ColoredLabel data={{ label: rowData.poste.label, color: rowData.poste.color }} />}
                ></Column>
                <Column
                    field="nature"
                    header="Nature"
                    body={(rowData: AccountLineRule) => rowData.nature && <ColoredLabel data={{ label: rowData.nature.label, color: rowData.nature.color }} />}
                ></Column>
                <Column field="occurrencesCount" header="Occurences"></Column>
                <Column
                    header="Actions"
                    body={(rowData: AccountLineRule) => (
                        <div className="flex gap-1 items-center">
                            {editingId === rowData.id ? (
                                <>
                                    <Button icon="pi pi-check" text className="p-button-sm" loading={!!busyIds[rowData.id]} onClick={() => void saveEdit(rowData.id)} />
                                    <Button icon="pi pi-times" text className="p-button-sm" onClick={() => cancelEdit(rowData.id)} />
                                </>
                            ) : (
                                <>
                                    {onUpdate && <Button icon="pi pi-pencil" text className="p-button-sm" onClick={() => startEdit(rowData)} />}
                                    {onDelete && <Button icon="pi pi-trash" text className="p-button-danger p-button-sm" onClick={() => requestDelete(rowData)} loading={!!busyIds[rowData.id]} />}
                                </>
                            )}
                        </div>
                    )}
                />
            </DataTable>
        </Card>

    )
}