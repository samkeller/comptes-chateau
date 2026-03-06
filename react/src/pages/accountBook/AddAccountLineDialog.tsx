import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import AccountLine from '../../interfaces/AccountLine';
import { AccountLineNature } from '../../interfaces/AccountLineNature';
import { AccountLinePoste } from '../../interfaces/AccountLinePoste';
import AccountingService from '../../services/AccountingService';
import { FloatLabel } from 'primereact/floatlabel';
import { parseDateToDDMMYYYY, parseDDMMYYYYToDate } from '../../utils/DatesUtils';
import { ColoredLabel } from '../../components/datatableBodys/ColoredLabel';
import { useGlobalToast } from '../../components/GlobalToast';
import AccountLinePosteService from '../../services/AccountLinePosteService';
import AccountLineNatureService from '../../services/AccountLineNatureService';

interface AddAcountLineDialogProps {
    editingLine: AccountLine | null;
    hideDialog: () => void;
    refresh: () => void;
}

export default function AddAccountLineDialog({ editingLine, hideDialog, refresh }: AddAcountLineDialogProps) {
    const [dateOperation, setDateOperation] = useState<string>(editingLine ? parseDateToDDMMYYYY(editingLine.dateOperation) : "");
    const [dateValeur, setDateValeur] = useState<string>(editingLine && editingLine.dateValeur ? parseDateToDDMMYYYY(editingLine.dateValeur) : "");
    const [label, setLabel] = useState<string>(editingLine?.label || '');
    const [nature, setNature] = useState<AccountLineNature | null>(editingLine?.nature || null);
    const [poste, setPoste] = useState<AccountLinePoste | null>(editingLine?.poste || null);
    const [amount, setAmount] = useState<number>((editingLine?.credit || 0) - (editingLine?.debit || 0));

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

            if (!editingLine) {
                // Théoriquement, ces deux valeurs ne devraient pas être nulles.
                setNature(naturesData[0] || null);
                setPoste(postesData[0] || null);
            }
            setLoading(false);
        });
    }, [editingLine]);

    const natureOptions = natures.map(v => ({ label: v.label, value: v }));
    const posteOptions = postes.map(v => ({ label: v.label, value: v }));

    const handleSubmit = async () => {
        if (!dateOperation) return;
        const accountLine: Partial<AccountLine> = {
            id: editingLine ? editingLine.id : 0,
            dateOperation: parseDDMMYYYYToDate(dateOperation),
            dateValeur: dateValeur ? parseDDMMYYYYToDate(dateValeur) : null,
            label,
            nature,
            poste,
            debit: amount < 0 ? (Math.abs(amount) || 0) : 0,
            credit: amount > 0 ? (amount || 0) : 0,
        };
        try {
            await new AccountingService().saveAccountingLine(accountLine);
            refresh();
            showGlobalToast({
                severity: 'success',
                summary: editingLine ? "Dépense modifiée" : "Dépense ajoutée",
                detail: editingLine ? "La dépense a été modifiée avec succès." : "La dépense a été ajoutée avec succès."
            })
            hideDialog();
        } catch (error) {
            console.error('Error creating account line', error);
        }
    };

    const footer = <div>
        <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
        <Button label={editingLine?.id ? "Modifier" : "Ajouter"} icon="pi pi-check" onClick={handleSubmit} />
    </div>

    if (loading) {
        return <Dialog visible header="Chargement..." style={{ width: '60vw' }} onHide={hideDialog}>
            <div>Chargement des options...</div>
        </Dialog>
    }

    return (
        <Dialog
            visible
            header={editingLine?.id ? "Modifier une dépense" : "Ajouter une dépense"}
            footer={footer}
            style={{ width: '60vw' }}
            onHide={() => hideDialog()}
        >
            <div className="flex flex-column gap-4 pt-4">
                <div className='flex gap-1'>
                    <FloatLabel className='flex-1'>
                        <Calendar id="dateOperation"
                            value={parseDDMMYYYYToDate(dateOperation)}
                            onChange={(e) => e.value && setDateOperation(parseDateToDDMMYYYY(e.value))}
                            dateFormat="dd/mm/yy"
                            className='w-full'
                        />
                        <label htmlFor="dateOperation">Date d'opération</label>
                    </FloatLabel>

                    <FloatLabel className='flex-1'>
                        <Calendar
                            id="dateValeur"
                            value={parseDDMMYYYYToDate(dateValeur)}
                            onChange={(e) => e.value && setDateValeur(parseDateToDDMMYYYY(e.value))}
                            dateFormat="dd/mm/yy"
                            className='w-full'
                        />
                        <label htmlFor="dateValeur">Date de valeur <small>(optionnel)</small></label>
                    </FloatLabel>
                </div>
                <FloatLabel className='flex-1'>
                    <InputText
                        id="operation"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className='w-full'
                    />
                    <label htmlFor="operation">Opération</label>
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
                            valueTemplate={(option) => <ColoredLabel data={option.value} />}
                        />
                        <label htmlFor="nature">Nature <small>(optionnel)</small></label>
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
                            valueTemplate={(option) => <ColoredLabel data={option.value} />}
                        />
                        <label htmlFor="poste">Poste <small>(optionnel)</small></label>
                    </FloatLabel>
                </div>
                <div className='flex gap-2'>
                    <FloatLabel className='flex-1'>
                        <InputNumber
                            id="amount"
                            value={amount}
                            onValueChange={(e) => setAmount(e.value || 0)}
                            mode="currency" currency="EUR"
                            locale="fr-FR"
                            className='w-full'
                            invalid={amount === 0}
                        />
                        <label htmlFor="amount">Montant</label>
                    </FloatLabel>
                    <div className="flex align-items-center">
                        <small>
                            {
                                amount < 0 ?
                                    "Débit" :
                                    "Crédit"
                            }
                        </small>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}