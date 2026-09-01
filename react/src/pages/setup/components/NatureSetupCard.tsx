import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import { Column } from "primereact/column";
import { ColorPicker, ColorPickerChangeEvent } from "primereact/colorpicker";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { BooleanIcon } from "../../../components/datatableBodys/BooleanIcon";
import { useGlobalToast } from "../../../context/GlobalToastContext";
import { AccountLineNature } from "../../../interfaces/AccountLineNature";
import { DEFAULT_SETUP_COLOR, fromColorPickerValue, isHexColor, toColorPickerValue } from "../setupUtils";
import AccountLineNatureService from "../../../services/AccountLineNatureService";
import type { SaveNaturePayload } from "@chocosous/shared";
import TooltipInfoIcon from "../../../components/TooltipInfoIcon";

const NEW_NATURE_ROW_ID = -1;
const NATURE_CONFIRM_GROUP = "nature-setup-delete";

const buildEmptyNatureDraft = (): SaveNaturePayload => ({
    label: "",
    color: DEFAULT_SETUP_COLOR,
    isHorsCompte: false
});

const service = new AccountLineNatureService();

type NatureTableRow = AccountLineNature & {
    uiEditing: boolean;
}

export default function NatureSetupCard() {
    const [natures, setNatures] = useState<AccountLineNature[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const showToast = useGlobalToast();

    const [draftByNatureId, setDraftByNatureId] = useState<Record<number, SaveNaturePayload>>({
        [NEW_NATURE_ROW_ID]: buildEmptyNatureDraft()
    });

    useEffect(() => {
        loadNatures();
    }, []);

    const loadNatures = (): void => {
        setLoading(true);
        service
            .getAllNatures()
            .then(setNatures)
            .finally(() => {
                setLoading(false);
            });
    }



    const tableRows: NatureTableRow[] = [
        ...natures.map((nature) => {
            const draft = draftByNatureId[nature.id];
            if (!draft) {
                return {
                    ...nature,
                    uiEditing: false
                };
            }

            return {
                ...nature,
                ...draft,
                uiEditing: true
            };
        }),
        {
            id: NEW_NATURE_ROW_ID,
            ...draftByNatureId[NEW_NATURE_ROW_ID],
            linkedAccountLines: 0,
            uiEditing: true
        } as NatureTableRow
    ];

    const isNewNatureRow = (row: NatureTableRow): boolean => row.id === NEW_NATURE_ROW_ID;

    const updateRowDraft = (rowId: number, patch: Partial<SaveNaturePayload>) => {
        setDraftByNatureId((prev) => {
            const sourceDraft = prev[rowId] ?? buildEmptyNatureDraft();
            return {
                ...prev,
                [rowId]: {
                    ...sourceDraft,
                    ...patch
                }
            };
        });
    };

    const validateNature = (payload: SaveNaturePayload): boolean => {
        if (!payload.label.trim()) {
            showToast({ severity: "warn", summary: "Validation", detail: "Le label de la nature est obligatoire" });
            return false;
        }

        if (!isHexColor(payload.color)) {
            showToast({ severity: "warn", summary: "Validation", detail: "La couleur doit etre au format #RRGGBB" });
            return false;
        }

        return true;
    };

    const createNature = () => {
        const newNature = draftByNatureId[NEW_NATURE_ROW_ID] ?? buildEmptyNatureDraft();

        if (!validateNature(newNature)) {
            return;
        }

        service
            .createNature({
                ...newNature,
                label: newNature.label.trim()
            })
            .then(() => {
                setDraftByNatureId((prev) => ({
                    ...prev,
                    [NEW_NATURE_ROW_ID]: buildEmptyNatureDraft()
                }));
                showToast({ severity: "success", summary: "Nature créée" });
                return loadNatures();
            })
    };

    /**
     * Ajoute la ligne à la map.
     * @param nature La nature à éditer
     */
    const startEditNature = (nature: AccountLineNature) => {
        setDraftByNatureId((prev) => ({
            ...prev,
            [nature.id]: {
                label: nature.label,
                color: nature.color,
                isHorsCompte: nature.isHorsCompte
            }
        }));
    };

    const saveNature = (rowId: number) => {
        const editingNatureDraft = draftByNatureId[rowId];
        if (!editingNatureDraft) {
            return;
        }

        if (!validateNature(editingNatureDraft)) {
            return;
        }

        service
            .updateNature(rowId, {
                ...editingNatureDraft,
                label: editingNatureDraft.label.trim()
            })
            .then(() => {
                // reset
                setDraftByNatureId((prev) => {
                    const next = { ...prev };
                    delete next[rowId];
                    return next;
                });

                return loadNatures();
            })
            .then(() => {
                showToast({ severity: "success", summary: "Nature mise à jour" });
            })
    };

    const requestDeleteNature = (nature: AccountLineNature) => {
        const dialog = confirmDialog({
            group: NATURE_CONFIRM_GROUP,
            header: "Supprimer la nature",
            message: `La nature \"${nature.label}\" sera supprimee. ${nature.linkedAccountLines ?? 0} operation(s) liee(s) perdront leur nature. Continuer ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                service
                    .deleteNature(nature.id)
                    .then(() => loadNatures())
                    .then(() => {
                        showToast({ severity: "success", summary: "Nature supprimée" });
                        dialog.hide();
                    })
            }
        });
    };

    return (
        <Card title="Natures de depense" className="h-full">
            <ConfirmDialog group={NATURE_CONFIRM_GROUP} />
            <DataTable
                value={tableRows}
                loading={loading}
                size="small"
                dataKey="id"
                cellMemo
            >
                <Column
                    header="Label"
                    body={(row: NatureTableRow) => {
                        if (!row.uiEditing)
                            return row.label;

                        return (
                            <InputText
                                value={row.label}
                                onChange={(event) => updateRowDraft(row.id, { label: event.target.value })}
                                className="w-full"
                                placeholder={isNewNatureRow(row) ? "Nouvelle nature" : undefined}
                            />
                        );
                    }}
                />
                <Column
                    header="Couleur"
                    body={(row: NatureTableRow) => {
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
                    header={<span>Hors compte <TooltipInfoIcon tooltipText="Non pris en compte dans le solde du compte." /> </span>}
                    body={(row: NatureTableRow) => {
                        if (!row.uiEditing)
                            return <BooleanIcon value={row.isHorsCompte} />;

                        return (
                            <Checkbox
                                checked={row.isHorsCompte}
                                onChange={(event: CheckboxChangeEvent) => updateRowDraft(row.id, { isHorsCompte: !!event.checked })}
                            />
                        );
                    }}
                />
                <Column
                    header="Ops liées"
                    body={(row: NatureTableRow) => isNewNatureRow(row) ? "-" : (row.linkedAccountLines ?? 0)}
                />
                <Column
                    header="Actions"
                    body={(row: NatureTableRow) => (
                        <div className="flex gap-1">
                            {
                                row.uiEditing ?
                                    isNewNatureRow(row) ?
                                        <Button icon="pi pi-plus" text className="p-button-sm" onClick={() => createNature()} /> :
                                        <Button icon="pi pi-check" text className="p-button-sm" onClick={() => saveNature(row.id)} /> :
                                    !isNewNatureRow(row) &&
                                    <Button icon="pi pi-pencil" text className="p-button-sm" onClick={() => startEditNature(row)} />
                            }
                            {
                                !isNewNatureRow(row) &&
                                <Button icon="pi pi-trash" text className="p-button-danger p-button-sm" onClick={() => requestDeleteNature(row)} />
                            }
                        </div>
                    )}
                />
            </DataTable>
        </Card>
    );
}
