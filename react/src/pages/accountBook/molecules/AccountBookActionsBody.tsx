import { useGlobalToast } from "@/context/GlobalToastContext"
import { useAccountId } from "@/hooks/useAccountId"
import AccountLine from "@/interfaces/AccountLine"
import AccountingService from "@/services/AccountingService"
import { Button } from "primereact/button"
import { ConfirmDialog } from "primereact/confirmdialog"
import { useState } from "react"

interface AccountBookActionsBodyProps {
    data: AccountLine
    setEditingLine: (line: AccountLine) => void
    setShowAddDialog: (show: boolean) => void
    refresh: () => void
}

export default function AccountBookActionsBody({ data, setEditingLine, setShowAddDialog, refresh }: AccountBookActionsBodyProps) {
    const accountId = useAccountId()
    const accountService = new AccountingService();
    const showGlobalToast = useGlobalToast();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const confirmLineDeletion = () => {
        accountService
            .deleteAccountingLine(accountId, data.id)
            .then(() => {
                showGlobalToast({
                    severity: 'success',
                    summary: 'Suppression confirmée',
                });
                refresh();
            });
    }

    return (
        <div className="flex gap-2">
            <ConfirmDialog
                visible={showConfirmDialog}
                onHide={() => setShowConfirmDialog(false)}
                message='Voulez-vous vraiment supprimer cette ligne ?'
                header='Confirmation'
                icon='pi pi-info-circle'
                defaultFocus='reject'
                acceptClassName='p-button-danger'
                accept={confirmLineDeletion}
            />
            <Button
                rounded text icon="pi pi-pencil"
                tooltip="Modifier"
                onClick={() => {
                    setEditingLine(data)
                    setShowAddDialog(true)
                }}
            ></Button>
            <Button
                rounded text icon="pi pi-trash" severity="danger"
                onClick={() => setShowConfirmDialog(true)}
            />
        </div>
    )
}