import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import AccountLineRule from "@/interfaces/AccountLineRule";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { DataTable } from "primereact/datatable";

interface AccountLineCategorizationDatatableProps {
    accountLineRules: AccountLineRule[];
    onDelete: (id: number) => Promise<void>;
}

export default function AccountLineCategorizationDatatable({
    accountLineRules,
    onDelete,
}: AccountLineCategorizationDatatableProps) {


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
                value={accountLineRules}
                paginator
                rows={20}
                rowsPerPageOptions={[10, 20, 50]}
                size="small"
            >
                <Column
                    field="pattern"
                    header="Pattern"
                />
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
                    body={(row: AccountLineRule) =>
                        <div className="flex gap-1 justify-end">
                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                className="p-button-sm"
                                onClick={() => requestDelete(row)}
                                tooltip="Supprimer"
                                tooltipOptions={{ position: "left" }}
                            />
                        </div>
                    }
                />
            </DataTable>
        </Card>
    );
}
