import { useEffect, useState } from "react"
import AccountLine from "../../interfaces/AccountLine"
import AccountingService from "../../services/AccountingService"
import { DataTable } from "primereact/datatable"
import { Column, ColumnBodyOptions } from "primereact/column"
import { Card } from "primereact/card"

function AccountBook() {

    const [accountLines, setAccountLines] = useState<AccountLine[]>([])

    useEffect(() => {
        new AccountingService().getAllAccountingLines().then(lines => {
            setAccountLines(lines)
        })
    }, [])

    const isHorsCbBody = (data: AccountLine, options: ColumnBodyOptions) => {
        return data.isHorsCB ?
            <i className="pi pi-check text-green-500"></i> :
            <i className="pi pi-times text-red-500"></i>
    }
    return (
        <div className="p-5">
            <Card>
                <DataTable
                    value={accountLines}
                    size="small"
                    paginator rows={20} rowsPerPageOptions={[5, 10, 25, 50]}
                >
                    <Column field="dateOperation" header="Date opération" body={(v: AccountLine, o) => v.getDisplayDateOperation()}></Column>
                    <Column field="dateValeur" header="Date valeur" body={(v: AccountLine) => v.getDisplayDateValeur()}></Column>
                    <Column field="operation" header="Opération"></Column>
                    <Column field="nature" header="Nature"></Column>
                    <Column field="poste" header="Poste"></Column>
                    <Column field="solde" header="Solde"></Column>
                    <Column field="isHorsCb" header="Est hors CB" body={isHorsCbBody}></Column>
                </DataTable>
            </Card>
        </div>
    )
}

export default AccountBook