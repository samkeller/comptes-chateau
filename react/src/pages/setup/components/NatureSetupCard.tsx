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
import { useGlobalToast } from "../../../components/GlobalToast";
import { AccountLineNature } from "../../../interfaces/AccountLineNature";
import { DEFAULT_SETUP_COLOR, extractApiError, fromColorPickerValue, isHexColor, toColorPickerValue } from "../setupUtils";
import AccountLineNatureService, { SaveNaturePayload } from "../../../services/AccountLineNatureService";
import TooltipInfoIcon from "../../../components/TooltipInfoIcon";

const NEW_NATURE_ROW_ID = -1;

const buildEmptyNatureDraft = (): SaveNaturePayload => ({
    label: "",
    color: DEFAULT_SETUP_COLOR,
    isHorsCompte: false
});

const service = new AccountLineNatureService();

export default function NatureSetupCard() {
    const [natures, setNatures] = useState<AccountLineNature[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const showToast = useGlobalToast();

    useEffect(() => {
        loadNatures();
    }, []);

    const loadNatures = async () => {
        setLoading(true);
        try {
            const loadedNatures = await service.getAllNatures();
            setNatures(loadedNatures);
        } catch (error) {
            showToast({ severity: "error", summary: "Natures", detail: extractApiError(error) });
        } finally {
            setLoading(false);
        }
    }

    const [draftByNatureId, setDraftByNatureId] = useState<Record<number, SaveNaturePayload>>({
        [NEW_NATURE_ROW_ID]: buildEmptyNatureDraft()
    });

    const tableRows: AccountLineNature[] = [
        ...natures,
        new AccountLineNature({
            id: NEW_NATURE_ROW_ID,
            ...draftByNatureId[NEW_NATURE_ROW_ID],
            linkedAccountLines: 0
        })
    ];

    const isNewNatureRow = (row: AccountLineNature): boolean => row.id === NEW_NATURE_ROW_ID;
    const isEditingNature = (row: AccountLineNature): boolean => draftByNatureId[row.id] !== undefined;

    const getRowDraft = (row: AccountLineNature): SaveNaturePayload => {
        const existingDraft = draftByNatureId[row.id];
        if (existingDraft) {
            return existingDraft;
        }

        return {
            label: row.label,
            color: row.color,
            isHorsCompte: row.isHorsCompte
        };
    };

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

    const createNature = async () => {
        const newNature = draftByNatureId[NEW_NATURE_ROW_ID] ?? buildEmptyNatureDraft();

        if (!validateNature(newNature)) {
            return;
        }

        try {
            await service.createNature({
                ...newNature,
                label: newNature.label.trim()
            });
            setDraftByNatureId((prev) => ({
                ...prev,
                [NEW_NATURE_ROW_ID]: buildEmptyNatureDraft()
            }));
            showToast({ severity: "success", summary: "Natures", detail: "Nature créée" });
            showToast({ severity: "success", summary: "Natures", detail: "Nature creee" });
        } catch (error) {
            showToast({ severity: "error", summary: "Natures", detail: extractApiError(error) });
        }
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

    const saveNature = async (rowId: number) => {
        const editingNatureDraft = draftByNatureId[rowId];
        if (!editingNatureDraft) {
            return;
        }

        if (!validateNature(editingNatureDraft)) {
            return;
        }

        try {
            await service.updateNature(rowId, {
                ...editingNatureDraft,
                label: editingNatureDraft.label.trim()
            });

            // reset
            setDraftByNatureId((prev) => {
                const next = { ...prev };
                delete next[rowId];
                return next;
            });

            await loadNatures();
            showToast({ severity: "success", summary: "Natures", detail: "Nature mise a jour" });
        } catch (error) {
            showToast({ severity: "error", summary: "Natures", detail: extractApiError(error) });
        }
    };

    const requestDeleteNature = (nature: AccountLineNature) => {
        confirmDialog({
            header: "Supprimer la nature",
            message: `La nature \"${nature.label}\" sera supprimee. ${nature.linkedAccountLines ?? 0} operation(s) liee(s) perdront leur nature. Continuer ?`,
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                try {
                    await service.deleteNature(nature.id);
                    await loadNatures();
                    showToast({ severity: "success", summary: "Natures", detail: "Nature supprimee" });
                } catch (error) {
                    showToast({ severity: "error", summary: "Natures", detail: extractApiError(error) });
                }
            }
        });
    };

    return (
        <Card title="Natures de depense" className="h-full">
            <ConfirmDialog />
            <DataTable value={tableRows} loading={loading} size="small" dataKey="id" responsiveLayout="scroll">
                <Column
                    header="Label"
                    body={(row: AccountLineNature) => {
                        if (!isEditingNature(row))
                            return row.label;

                        return (
                            <InputText
                                value={getRowDraft(row).label}
                                onChange={(event) => updateRowDraft(row.id, { label: event.target.value })}
                                className="w-full"
                                placeholder={isNewNatureRow(row) ? "Nouvelle nature" : undefined}
                            />
                        );
                    }}
                />
                <Column
                    header="Couleur"
                    body={(row: AccountLineNature) => {
                        if (!isEditingNature(row)) {
                            return (
                                <span className="inline-flex align-items-center gap-2">
                                    <span className="border-circle inline-block" style={{ width: "1rem", height: "1rem", backgroundColor: row.color }} />
                                </span>
                            );
                        }

                        return (
                            <ColorPicker
                                format="hex"
                                value={toColorPickerValue(getRowDraft(row).color)}
                                onChange={(event: ColorPickerChangeEvent) => updateRowDraft(row.id, {
                                    color: fromColorPickerValue(event.value)
                                })}
                            />
                        );
                    }}
                />
                <Column
                    header={<span>Hors compte <TooltipInfoIcon tooltipText="Non pris en compte dans le solde du compte." /> </span>}
                    body={(row: AccountLineNature) => {
                        if (!isEditingNature(row))
                            return <BooleanIcon value={row.isHorsCompte} />;

                        return (
                            <Checkbox
                                checked={getRowDraft(row).isHorsCompte}
                                onChange={(event: CheckboxChangeEvent) => updateRowDraft(row.id, { isHorsCompte: !!event.checked })}
                            />
                        );
                    }}
                />
                <Column
                    header="Ops liées"
                    body={(row: AccountLineNature) => isNewNatureRow(row) ? "-" : (row.linkedAccountLines ?? 0)}
                />
                <Column
                    header="Actions"
                    body={(row: AccountLineNature) => (
                        <div className="flex gap-1">
                            {
                                isEditingNature(row) ?
                                    isNewNatureRow(row) ?
                                        <Button icon="pi pi-plus" text className="p-button-sm" onClick={createNature} /> :
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
