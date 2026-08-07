import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import AccountLineNatureDropdown from "../../../components/atoms/accountLine/AccountLineNatureDropdown";
import AccountLinePosteDropdown from "../../../components/atoms/accountLine/AccountLinePosteDropdown";
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import RecurringExpense, { RecurringExpenseFrequency } from '../../../interfaces/RecurringExpense';
import RecurringExpenseService from '../../../services/RecurringExpenseService';
import { FloatLabel } from 'primereact/floatlabel';
import { Calendar } from 'primereact/calendar';
import { useGlobalToast } from '../../../context/GlobalToastContext';
import AccountLineNatureService from '../../../services/AccountLineNatureService';
import AccountLinePosteService from '../../../services/AccountLinePosteService';

interface AddRecurringExpenseDialogProps {
    accountId: number;
    editingExpense: RecurringExpense | null;
    hideDialog: () => void;
    refresh: () => void;
}

export default function AddRecurringExpenseDialog({ accountId, editingExpense, hideDialog, refresh }: AddRecurringExpenseDialogProps) {
    const [label, setLabel] = useState<string>(editingExpense?.label || '');
    const [natureId, setNatureId] = useState<number | null>(editingExpense?.nature?.id ?? null);
    const [posteId, setPosteId] = useState<number | null>(editingExpense?.poste?.id ?? null);
    const [solde, setSolde] = useState<number>(editingExpense?.solde || 0);
    const [isActive, setIsActive] = useState<boolean>(editingExpense?.isActive ?? true);
    const [nextOccurrence, setNextOccurrence] = useState<Date>(editingExpense?.nextOccurrence || new Date());
    const [frequency, setFrequency] = useState<RecurringExpenseFrequency>(editingExpense?.frequency ?? "monthly");


    const [loading, setLoading] = useState(true);
    const showGlobalToast = useGlobalToast();

    useEffect(() => {
        const natureService = new AccountLineNatureService();
        const posteService = new AccountLinePosteService();

        void Promise.all([
            natureService.getAllNatures(),
            posteService.getAllAccountPostes(accountId)
        ])
            .then(([naturesData, postesData]) => {
                if (!editingExpense) {
                    setNatureId(naturesData[0]?.id ?? null);
                    setPosteId(postesData[0]?.id ?? null);
                    return;
                }

                setNatureId(editingExpense.nature?.id ?? null);
                setPosteId(editingExpense.poste?.id ?? null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [editingExpense, accountId]);



    const handleSubmit = () => {
        if (!label || !natureId || !posteId) return;

        const expense: Partial<RecurringExpense> = {
            id: editingExpense ? editingExpense.id : 0,
            label,
            natureId,
            posteId,
            solde,
            isActive,
            nextOccurrence,
            frequency
        };

        new RecurringExpenseService()
            .saveAccountRecurringExpense(accountId, expense)
            .then(() => {
                refresh();
                showGlobalToast({
                    severity: 'success',
                    summary: editingExpense ? "Dépense récurrente modifiée" : "Dépense récurrente ajoutée",
                    detail: editingExpense ? "La dépense récurrente a été modifiée avec succès." : "La dépense récurrente a été ajoutée avec succès."
                });
                hideDialog();
            })
    };

    const footer = <div>
        <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
        <Button label={editingExpense?.id ? "Modifier" : "Ajouter"} icon="pi pi-check" onClick={handleSubmit} />
    </div>

    if (loading) {
        return <Dialog visible header="Chargement..." style={{ width: '60vw' }} onHide={hideDialog}>
            <div>Chargement des options...</div>
        </Dialog>
    }

    return (
        <Dialog
            visible
            header={editingExpense?.id ? "Modifier une dépense récurrente" : "Ajouter une dépense récurrente"}
            footer={footer}
            style={{ width: '60vw' }}
            onHide={() => hideDialog()}
        >
            <div className="flex flex-col gap-12 pt-12">
                <FloatLabel className='flex-1'>
                    <InputText
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className='w-full'
                    />
                    <label htmlFor="label">Libellé</label>
                </FloatLabel>
                <div className='flex gap-1'>
                    <FloatLabel className='flex-1'>
                        <AccountLineNatureDropdown
                            id="nature"
                            value={natureId}
                            onChange={(e) => setNatureId(e.value as number | null)}
                            className='w-full'
                        />
                        <label htmlFor="nature">Nature</label>
                    </FloatLabel>
                    <FloatLabel className='flex-1'>
                        <AccountLinePosteDropdown
                            id="poste"
                            accountId={accountId}
                            value={posteId}
                            onChange={(e) => setPosteId(e.value as number | null)}
                            className='w-full'
                        />
                        <label htmlFor="poste">Poste</label>
                    </FloatLabel>
                </div>
                <div className='flex gap-1 items-center'>
                    <FloatLabel className='flex-1'>
                        <InputNumber id="solde" value={solde} onValueChange={(e) => setSolde(e.value || 0)} mode="currency" currency="EUR" locale="fr-FR" className='w-full' />
                        <label htmlFor="solde">Montant</label>
                    </FloatLabel>
                    <div className="flex items-center gap-2">
                        <label htmlFor="isActive">Actif</label>
                        <InputSwitch id="isActive" checked={isActive} onChange={(e) => setIsActive(e.value)} />
                    </div>
                </div>
                <div className='flex gap-1'>
                    <FloatLabel className='flex-1'>
                        <Calendar
                            id='nextOccurrence'
                            dateFormat="dd/mm/yy"
                            value={nextOccurrence}
                            onChange={(e) => e.value && setNextOccurrence(e.value)}
                            className='w-full'
                        />
                        <label htmlFor="nextOccurrence">Première activation</label>
                    </FloatLabel>
                    <FloatLabel className='flex-1'>
                        <Dropdown id="frequency"
                            value={frequency}
                            options={[
                                { label: "Hebdomadaire", value: "weekly" },
                                { label: "Mensuelle", value: "monthly" },
                                { label: "Trimestrielle", value: "quarterly" },
                                { label: "Annuelle", value: "yearly" }
                            ]}
                            className='w-full'
                            onChange={(e) => setFrequency(e.value as RecurringExpenseFrequency)}
                        />
                        <label htmlFor="frequency">Fréquence</label>
                    </FloatLabel>
                </div>
            </div>
        </Dialog>
    );
}
