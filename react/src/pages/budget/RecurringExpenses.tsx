import { Card } from "primereact/card";
import { useEffect, useState } from "react";
import RecurringExpense from "../../interfaces/RecurringExpense";
import RecurringExpenseService from "../../services/RecurringExpenseService";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AddRecurringExpenseDialog from "./AddRecurringExpenseDialog";
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel";
import { Message } from "primereact/message";
import { formatDistance } from "date-fns";
import { Tooltip } from "primereact/tooltip";


export default function RecurringExpenses() {
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false)
    const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null)

    useEffect(() => {
        loadRecurringExpenses()
    }, [])

    const loadRecurringExpenses = async () => {
        const service = new RecurringExpenseService()
        const expenses = await service.getRecurringExpenses()
        setRecurringExpenses(expenses)
    }

    const actionsBody = (data: RecurringExpense) => {
        if (!data) return null
        return (
            <div className="flex">
                <Button
                    rounded text icon="pi pi-pencil" className="p-1"
                    tooltip="Modifier"
                    onClick={() => {
                        setEditingExpense(data)
                        setShowAddDialog(true)
                    }}
                ></Button>
            </div>
        )
    }

    const isActiveBody = (isActive: boolean) => {
        return isActive ?
            <i className="pi pi-check text-green-500"></i> :
            <i className="pi pi-times text-red-500"></i>
    }

    return (
        <>
            {
                showAddDialog && <AddRecurringExpenseDialog
                    editingExpense={editingExpense}
                    hideDialog={() => {
                        setEditingExpense(null)
                        setShowAddDialog(false)
                    }}
                    refresh={loadRecurringExpenses}
                />
            }
            <Card title="Dépenses récurrentes" className="flex-1">
                <Message text="Les dépenses récurrentes sont automatiquement ajoutées comme opérations à une fréquence donnée." className="mb-2" />
                <div className="flex justify-content-end mb-3">
                    <Button label="Ajouter" icon="pi pi-plus" onClick={() => setShowAddDialog(true)} />
                </div>
                <DataTable<Array<RecurringExpense>>
                    value={recurringExpenses}
                    size="small"
                >
                    <Column
                        field="label"
                        header="Libellé"
                        sortable
                    />
                    <Column
                        field="nature.label"
                        header="Types"
                        body={(v: RecurringExpense) => {
                            return <>
                                {v.nature ? <ColoredLabel data={v.nature} /> : null}
                                {v.poste ? <ColoredLabel data={v.poste} /> : null}
                            </>
                        }}
                    />
                    <Column
                        field="solde"
                        header="Montant"
                        body={(v: RecurringExpense) => v.solde.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    />
                    <Column
                        field="isActive"
                        header="Actif"
                        body={(v: RecurringExpense) => isActiveBody(v.isActive)}
                    />
                    <Column
                        field="nextOccurrence"
                        header="Prochaine activation"
                        body={(v: RecurringExpense) => {
                            return (
                                v.nextOccurrence && <>
                                    <Tooltip target=".custom-label-next-occurence" />
                                    <span
                                        className="custom-label-next-occurence"
                                        data-pr-tooltip={`${v.nextOccurrence.toLocaleDateString('fr-FR')} (mensuel)`}
                                    >
                                        {v.nextOccurrence && formatDistance(v.nextOccurrence, new Date(), { addSuffix: true })}
                                    </span>
                                </>
                            )
                        }}
                    />
                    <Column
                        header="Actions"
                        body={actionsBody}
                        style={{ width: '5rem' }}
                    />
                </DataTable>
            </Card>
        </>
    );
}