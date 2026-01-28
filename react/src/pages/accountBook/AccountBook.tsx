import { useEffect, useState } from "react"
import AccountLine from "../../interfaces/AccountLine"
import AccountingService from "../../services/AccountingService"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Card } from "primereact/card"
import { Button } from "primereact/button"
import AddAccountLineDialog from "./AddAccountLineDialog"
import { PageTemplate } from "../PageTemplate"
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel"

function AccountBook() {
    const [accountLines, setAccountLines] = useState<AccountLine[]>([])

    const [editingLine, setEditingLine] = useState<AccountLine | null>(null)
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false)

    const refreshLines = () => {
        new AccountingService().getAllAccountingLines().then(lines => {
            setAccountLines(lines)
        })
    }

    useEffect(() => {
        refreshLines()
    }, [])

    const isHorsCbBody = (data: AccountLine) => {
        return data.isHorsCB ?
            <i className="pi pi-check text-green-500"></i> :
            <i className="pi pi-times text-red-500"></i>
    }
    const actionsBody = (data: AccountLine) => {
        return (
            <Button
                rounded text icon="pi pi-pencil" className="mr-2"
                onClick={() => {
                    setEditingLine(data)
                    setShowAddDialog(true)
                }}
            ></Button>
        )
    }

    return (
        <PageTemplate>
            {
                showAddDialog && <AddAccountLineDialog
                    editingLine={editingLine}
                    hideDialog={() => {
                        setEditingLine(null)
                        setShowAddDialog(false)
                    }}
                    refresh={refreshLines}
                />
            }
            <div className="flex justify-content-end">
                <Button label="Ajouter une dépense" icon="pi pi-plus" className="mb-3" onClick={() => setShowAddDialog(true)} />
            </div>
            <Card>
                <DataTable
                    value={accountLines}
                    size="small"
                    paginator rows={20} rowsPerPageOptions={[5, 10, 25, 50]}
                >
                    <Column field="dateOperation" header="Date opération" body={(v: AccountLine) => v.displayDateOperation}></Column>
                    <Column field="dateValeur" header="Date valeur" body={(v: AccountLine) => v.displayDateValeur}></Column>
                    <Column field="operation" header="Opération"></Column>
                    <Column field="nature.label" header="Nature" body={(data: AccountLine) => data.nature && <ColoredLabel data={data.nature} />}></Column>
                    <Column field="poste.label" header="Poste" body={(data: AccountLine) => data.poste && <ColoredLabel data={data.poste} />}></Column>
                    <Column field="solde" header="Solde"></Column>
                    <Column field="isHorsCb" header="Est hors CB" body={isHorsCbBody}></Column>
                    <Column header="Actions" body={actionsBody} />
                </DataTable>
            </Card>
        </PageTemplate>
    )
}

export default AccountBook