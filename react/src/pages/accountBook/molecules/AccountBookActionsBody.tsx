import { useGlobalToast } from "@/context/GlobalToastContext"
import { useAccountId } from "@/hooks/useAccountId"
import AccountLine from "@/interfaces/AccountLine"
import AccountLineService from "@/services/AccountLineService"
import { Button, ButtonProps } from "primereact/button"
import { ConfirmDialog } from "primereact/confirmdialog"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface AccountBookActionsBodyProps {
    data: AccountLine,
    onDelete?: (accountLineId: number) => void,
    onDuplicate?: (accountLineId: number) => void,
}

const accountService = new AccountLineService();

export default function AccountBookActionsBody({ data, onDelete, onDuplicate }: AccountBookActionsBodyProps) {
    const accountId = useAccountId()
    const navigate = useNavigate()
    const showGlobalToast = useGlobalToast();
    
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const duplicateLine = () => {
        accountService
            .duplicateLine(accountId, data.id)
            .then(() => onDuplicate?.(data.id));
    }

    const confirmLineDeletion = () => {
        accountService
            .deleteAccountingLine(accountId, data.id)
            .then(() => {
                showGlobalToast({
                    severity: 'success',
                    summary: 'Suppression confirmée',
                });
                onDelete?.(data.id);
            });
    }

    const sharedButtonProps: ButtonProps = {
        rounded: true,
        text: true,
        style: { width: '2.5rem', height: '2.5rem' },
    };

    return (
        <div className="flex gap-0.5">
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
                {...sharedButtonProps}
                icon="pi pi-pencil"
                tooltip="Modifier"
                onClick={() => {
                    navigate(`/${accountId}/accountBook/${data.id}`)
                }}
            ></Button>
            <Button
                {...sharedButtonProps}
                icon="pi pi-copy"
                tooltip="Dupliquer"
                onClick={() => duplicateLine()}
            />
            <Button
                {...sharedButtonProps}
                icon="pi pi-trash" severity="danger"
                tooltip="Supprimer"
                onClick={() => setShowConfirmDialog(true)}
            />
        </div>
    )
}