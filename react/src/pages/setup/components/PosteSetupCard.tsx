import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { ColorPicker, ColorPickerChangeEvent } from "primereact/colorpicker";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";
import { useGlobalToast } from "../../../context/GlobalToastContext";
import { AccountLinePoste } from "../../../interfaces/AccountLinePoste";
import { DEFAULT_SETUP_COLOR, fromColorPickerValue, isHexColor, toColorPickerValue } from "../setupUtils";
import AccountLinePosteService from "../../../services/AccountLinePosteService";
import type { SavePostePayload } from "@chocosous/shared";
import AccountService from "../../../services/AccountService";
import Account from "../../../interfaces/Account";

const NEW_POSTE_ROW_ID = -1;
const POSTE_CONFIRM_GROUP = "poste-setup-delete";

const buildEmptyPosteDraft = (): SavePostePayload => ({
    label: "",
    color: DEFAULT_SETUP_COLOR
});

const service = new AccountLinePosteService();
const accountService = new AccountService();

type PosteTableRow = AccountLinePoste & {
    uiEditing: boolean;
}

export default function PosteSetupCard() {
    const showToast = useGlobalToast();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [postes, setPostes] = useState<AccountLinePoste[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        accountService.getAllAccounts().then((data) => {
            setAccounts(data);
            if (data.length > 0) {
                setSelectedAccountId(data[0].id);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedAccountId !== null) {
            loadPostes(selectedAccountId);
        }
    }, [selectedAccountId]);

    const loadPostes = (accountId: number): void => {
        setLoading(true);
        service
            .getAllAccountPostes(accountId)
            .then(setPostes)
            .finally(() => {
                setLoading(false);
            });
    }

    const [draftByPosteId, setDraftByPosteId] = useState<Record<number, SavePostePayload>>({
        [NEW_POSTE_ROW_ID]: buildEmptyPosteDraft()
    });

    const tableRows: PosteTableRow[] = [
        ...postes.map((poste) => {
            const draft = draftByPosteId[poste.id];
            if (!draft) {
                return {
                    ...poste,
                    uiEditing: false
                };
            }

            return {
                ...poste,
                ...draft,
                uiEditing: true
            };
        }),
        {
            id: NEW_POSTE_ROW_ID,
            ...draftByPosteId[NEW_POSTE_ROW_ID],
            linkedAccountLines: 0,
            uiEditing: true
        } as PosteTableRow
    ];

    const isNewPosteRow = (row: PosteTableRow): boolean => row.id === NEW_POSTE_ROW_ID;

    const updateRowDraft = (rowId: number, patch: Partial<SavePostePayload>) => {
        setDraftByPosteId((prev) => {
            const sourceDraft = prev[rowId] ?? buildEmptyPosteDraft();
            return {
                ...prev,
                [rowId]: {
                    ...sourceDraft,
                    ...patch
                }
            };
        });
    };

    const validatePoste = (payload: SavePostePayload): boolean => {
        if (!payload.label.trim()) {
            showToast({ severity: "error", summary: "Validation", detail: "Le label du poste est obligatoire" });
            return false;
        }

        if (!isHexColor(payload.color)) {
            showToast({ severity: "error", summary: "Validation", detail: "La couleur doit etre au format #RRGGBB" });
            return false;
        }

        return true;
    };

    const createPoste = () => {
        if (selectedAccountId === null) return;
        const newPoste = draftByPosteId[NEW_POSTE_ROW_ID] ?? buildEmptyPosteDraft();

        if (!validatePoste(newPoste)) {
            return;
        }

        service
            .createAccountPoste(selectedAccountId, {
                ...newPoste,
                label: newPoste.label.trim()
            })
            .then(() => {
                setDraftByPosteId((prev) => ({
                    ...prev,
                    [NEW_POSTE_ROW_ID]: buildEmptyPosteDraft()
                }));
                showToast({ severity: "success", summary: "Poste créé" });
                return loadPostes(selectedAccountId);
            })
    };

    const startEditPoste = (poste: AccountLinePoste) => {
        setDraftByPosteId((prev) => ({
            ...prev,
            [poste.id]: {
                label: poste.label,
                color: poste.color
            }
        }));
    };

    const savePoste = (rowId: number) => {
        if (selectedAccountId === null) return;
        const editingPosteDraft = draftByPosteId[rowId];
        if (!editingPosteDraft) {
            return;
        }

        if (!validatePoste(editingPosteDraft)) {
            return;
        }

        service
            .updateAccountPoste(selectedAccountId, rowId, {
                ...editingPosteDraft,
                label: editingPosteDraft.label.trim()
            })
            .then(() => {
                setDraftByPosteId((prev) => {
                    const next = { ...prev };
                    delete next[rowId];
                    return next;
                });

                return loadPostes(selectedAccountId);
            })
            .then(() => {
                showToast({ severity: "success", summary: "Poste mis à jour" });
            })
    };

    const requestDeletePoste = (poste: AccountLinePoste) => {
        if (selectedAccountId === null) return;
        const dialog = confirmDialog({
            group: POSTE_CONFIRM_GROUP,
            header: "Supprimer le poste",
            message: `Le poste \"${poste.label}\" sera supprime. ${poste.linkedAccountLines ?? 0} operation(s) liee(s) passeront a null. Continuer ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                dialog.hide();

                service
                    .deleteAccountPoste(selectedAccountId, poste.id)
                    .then(() => loadPostes(selectedAccountId))
                    .then(() => {
                        showToast({ severity: "success", summary: "Poste supprimé" });
                    })
            }
        });
    };

    return (
        <Card title="Postes de depense" className="h-full">
            <div className="mb-4">
                <Dropdown
                    value={selectedAccountId}
                    options={accounts.map((a) => ({ label: a.label, value: a.id }))}
                    onChange={(e) => setSelectedAccountId(e.value)}
                    placeholder="Sélectionner un compte"
                    className="w-full"
                    disabled={accounts.length === 0}
                />
            </div>
            <ConfirmDialog group={POSTE_CONFIRM_GROUP} />
            <DataTable
                value={selectedAccountId !== null ? tableRows : []}
                loading={loading}
                size="small"
                dataKey="id"
                cellMemo
            >
                <Column
                    header="Label"
                    body={(row: PosteTableRow) => {
                        if (!row.uiEditing) {
                            return row.label;
                        }

                        return (
                            <InputText
                                value={row.label}
                                onChange={(event) => updateRowDraft(row.id, { label: event.target.value })}
                                className="w-full"
                                placeholder={isNewPosteRow(row) ? "Nouveau poste" : undefined}
                            />
                        );
                    }}
                />
                <Column
                    header="Couleur"
                    body={(row: PosteTableRow) => {
                        if (!row.uiEditing) {
                            return (
                                <span className="inline-flex items-center gap-2">
                                    <span className="rounded-full inline-block" style={{ width: "1rem", height: "1rem", backgroundColor: row.color }} />
                                </span>
                            );
                        }

                        return (
                            <ColorPicker
                                format="hex"
                                value={toColorPickerValue(row.color)}
                                onChange={(event: ColorPickerChangeEvent) => updateRowDraft(row.id, {
                                    color: fromColorPickerValue(event.value)
                                })}
                            />
                        );
                    }}
                />
                <Column
                    header="Ops liees"
                    body={(row: PosteTableRow) => isNewPosteRow(row) ? "-" : (row.linkedAccountLines ?? 0)}
                />
                <Column
                    header="Actions"
                    body={(row: PosteTableRow) => (
                        <div className="flex gap-1">
                            {
                                row.uiEditing ?
                                    isNewPosteRow(row) ?
                                        <Button icon="pi pi-plus" text className="p-button-sm" onClick={createPoste} /> :
                                        <Button icon="pi pi-check" text className="p-button-sm" onClick={() => savePoste(row.id)} /> :
                                    !isNewPosteRow(row) &&
                                    <Button icon="pi pi-pencil" text className="p-button-sm" onClick={() => startEditPoste(row)} />
                            }
                            {
                                !isNewPosteRow(row) &&
                                <Button icon="pi pi-trash" text className="p-button-danger p-button-sm" onClick={() => requestDeletePoste(row)} />
                            }
                        </div>
                    )}
                />
            </DataTable>
        </Card>
    );
}

