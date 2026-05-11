import { useEffect, useState } from "react";
import { Card } from "primereact/card";
import RecurringExpense from "../../../interfaces/RecurringExpense";
import RecurringExpenseService from "../../../services/RecurringExpenseService";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AddRecurringExpenseDialog from "./AddRecurringExpenseDialog";
import { ColoredLabel } from "../../../components/datatableBodys/ColoredLabel";
import { Message } from "primereact/message";
import { formatDistance } from "date-fns";
import { Tooltip } from "primereact/tooltip";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { useGlobalToast } from "@/context/GlobalToastContext";
import JobService from "@/services/JobService";

interface RecurringExpensesProps {
    accountId: number;
}

export default function RecurringExpenses({ accountId }: RecurringExpensesProps) {
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false)
    const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null)
    const showGlobalToast = useGlobalToast();
    const jobService = new JobService()

    useEffect(() => {
        loadRecurringExpenses()
    }, [accountId])

    const loadRecurringExpenses = async () => {
        const service = new RecurringExpenseService()
        const expenses = await service.getAccountRecurringExpenses(accountId)
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
                    accountId={accountId}
                    editingExpense={editingExpense}
                    hideDialog={() => {
                        setEditingExpense(null)
                        setShowAddDialog(false)
                    }}
                    refresh={loadRecurringExpenses}
                />
            }
            <div className="flex-1">
                <Message text="Les dépenses récurrentes sont automatiquement ajoutées comme opérations à une fréquence donnée." className="mb-2" />
                <div className="flex justify-end mb-6 gap-4">
                    <Button label="Ajouter" icon="pi pi-plus" onClick={() => setShowAddDialog(true)} />
                    <Button
                        severity="danger" text icon="pi pi-server"
                        tooltip="⚠️ Déclencher manuellement les crons"
                        tooltipOptions={{ position: "left" }}
                        onClick={(event) => {
                            confirmPopup({
                                target: event.currentTarget,
                                message: 'Êtes-vous sûr de déclencher manuellement le script cron ?',
                                icon: 'pi pi-info-circle',
                                defaultFocus: 'reject',
                                acceptClassName: 'p-button-danger',
                                accept: () => {
                                    jobService.runRecurringExpenses().then((jobResponse) => {
                                        loadRecurringExpenses();
                                        showGlobalToast({
                                            severity: 'success',
                                            summary: `Script cron exécuté avec succès`,
                                            detail: `Lignes comptables créées : ${jobResponse.processedCount}`
                                        })
                                    })
                                }
                            })
                        }} />
                        <ConfirmPopup />
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
            </div>
        </>
    );
}