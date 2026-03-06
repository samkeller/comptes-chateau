import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import RecurringExpense from '../../../interfaces/RecurringExpense';
import { AccountLineNature } from '../../../interfaces/AccountLineNature';
import { AccountLinePoste } from '../../../interfaces/AccountLinePoste';
import RecurringExpenseService from '../../../services/RecurringExpenseService';
import { FloatLabel } from 'primereact/floatlabel';
import { ColoredLabel } from '../../../components/datatableBodys/ColoredLabel';
import { Calendar } from 'primereact/calendar';
import { useGlobalToast } from '../../../components/GlobalToast';
import AccountLineNatureService from '../../../services/AccountLineNatureService';
import AccountLinePosteService from '../../../services/AccountLinePosteService';

interface AddRecurringExpenseDialogProps {
    editingExpense: RecurringExpense | null;
    hideDialog: () => void;
    refresh: () => void;
}

export default function AddRecurringExpenseDialog({ editingExpense, hideDialog, refresh }: AddRecurringExpenseDialogProps) {
    const [label, setLabel] = useState<string>(editingExpense?.label || '');
    const [nature, setNature] = useState<AccountLineNature | null>(editingExpense?.nature || null);
    const [poste, setPoste] = useState<AccountLinePoste | null>(editingExpense?.poste || null);
    const [solde, setSolde] = useState<number>(editingExpense?.solde || 0);
    const [isActive, setIsActive] = useState<boolean>(editingExpense?.isActive ?? true);
    const [nextOccurrence, setNextOccurrence] = useState<Date>(editingExpense?.nextOccurrence || new Date());
    const [frequency] = useState("monthly");

    const [natures, setNatures] = useState<AccountLineNature[]>([]);
    const [postes, setPostes] = useState<AccountLinePoste[]>([]);
    const [loading, setLoading] = useState(true);
    const showGlobalToast = useGlobalToast();

    useEffect(() => {
        const natureService = new AccountLineNatureService();
        const posteService = new AccountLinePosteService();
        Promise.all([
            natureService.getAllNatures(),
            posteService.getAllPostes()
        ]).then(([naturesData, postesData]) => {
            setNatures(naturesData);
            setPostes(postesData);

            if (!editingExpense) {
                setNature(naturesData[0] || null);
                setPoste(postesData[0] || null);
            }
            setLoading(false);
        });
    }, [editingExpense]);

    const natureOptions = natures.map(v => ({ label: v.label, value: v }));
    const posteOptions = postes.map(v => ({ label: v.label, value: v }));

    const handleSubmit = async () => {
        if (!label || !nature || !poste) return;
        const expense: Partial<RecurringExpense> = {
            id: editingExpense ? editingExpense.id : 0,
            label,
            nature,
            poste,
            solde,
            isActive,
            nextOccurrence
        };
        try {
            await new RecurringExpenseService().saveRecurringExpense(expense);
            refresh();
            showGlobalToast({
                severity: 'success',
                summary: editingExpense ? "Dépense récurrente modifiée" : "Dépense récurrente ajoutée",
                detail: editingExpense ? "La dépense récurrente a été modifiée avec succès." : "La dépense récurrente a été ajoutée avec succès."
            });
            hideDialog();
        } catch (error) {
            console.error('Error saving recurring expense', error);
        }
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
            <div className="flex flex-column gap-4 pt-4">
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
                        <Dropdown id="nature"
                            value={nature}
                            options={natureOptions}
                            onChange={(e) => setNature(e.value)}
                            placeholder="Sélectionner une nature"
                            className='w-full'
                            itemTemplate={(option) => <ColoredLabel data={option.value} />}
                            valueTemplate={(option) => option.value ? <ColoredLabel data={option.value} /> : <span>Sélectionner</span>}
                        />
                        <label htmlFor="nature">Nature</label>
                    </FloatLabel>
                    <FloatLabel className='flex-1'>
                        <Dropdown
                            id="poste"
                            value={poste}
                            options={posteOptions}
                            onChange={(e) => setPoste(e.value)}
                            placeholder="Sélectionner un poste"
                            className='w-full'
                            itemTemplate={(option) => <ColoredLabel data={option.value} />}
                            valueTemplate={(option) => option.value ? <ColoredLabel data={option.value} /> : <span>Sélectionner</span>}
                        />
                        <label htmlFor="poste">Poste</label>
                    </FloatLabel>
                </div>
                <div className='flex gap-1 align-items-center'>
                    <FloatLabel className='flex-1'>
                        <InputNumber id="solde" value={solde} onValueChange={(e) => setSolde(e.value || 0)} mode="currency" currency="EUR" locale="fr-FR" className='w-full' />
                        <label htmlFor="solde">Montant</label>
                    </FloatLabel>
                    <div className="flex align-items-center gap-2">
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
                        <label htmlFor="nextOccurrence">Prochaine activation</label>
                    </FloatLabel>
                    <FloatLabel className='flex-1'>
                        <Dropdown id="frequency"
                            value={frequency}
                            options={[{ label: "Mensuelle", value: "monthly" }]}
                            disabled
                            className='w-full'
                        />
                        <label htmlFor="frequency">Fréquence</label>
                    </FloatLabel>
                </div>
            </div>
        </Dialog>
    );
}
