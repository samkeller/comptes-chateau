import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import AccountLine from '../../interfaces/AccountLine';
import { AccountLineNature } from '../../interfaces/AccountLineNature';
import { AccountLinePoste } from '../../interfaces/AccountLinePoste';
import AccountingService from '../../services/AccountingService';
import { FloatLabel } from 'primereact/floatlabel';
import { parseDateToDDMMYYYY, parseDDMMYYYYToDate } from '../../Utils/DatesUtils';

interface AddAcountLineDialogProps {
    editingLine: AccountLine | null;
    hideDialog: () => void;
    refresh: () => void;
}

export default function AddAccountLineDialog({ editingLine, hideDialog, refresh }: AddAcountLineDialogProps) {
    const [dateOperation, setDateOperation] = useState<string>(editingLine ? parseDateToDDMMYYYY(editingLine.dateOperation) : "");
    const [dateValeur, setDateValeur] = useState<string>(editingLine && editingLine.dateValeur ? parseDateToDDMMYYYY(editingLine.dateValeur) : "");
    const [operation, setOperation] = useState<string>(editingLine?.operation || '');
    const [nature, setNature] = useState<AccountLineNature | null>(editingLine?.nature || null);
    const [poste, setPoste] = useState<AccountLinePoste | null>(editingLine?.poste || null);
    const [solde, setSolde] = useState<number>(editingLine?.solde || 0);
    const [isHorsCB, setIsHorsCB] = useState<boolean>(editingLine?.isHorsCB || false);

    const [natures, setNatures] = useState<AccountLineNature[]>([]);
    const [postes, setPostes] = useState<AccountLinePoste[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const service = new AccountingService();
        Promise.all([
            service.getAllNatures(),
            service.getAllPostes()
        ]).then(([naturesData, postesData]) => {
            setNatures(naturesData);
            setPostes(postesData);
            setLoading(false);
        });
    }, []);

    const natureOptions = natures.map(v => ({ label: v.label, value: v }));
    const posteOptions = postes.map(v => ({ label: v.label, value: v }));

    const handleSubmit = async () => {
        if (!dateOperation) return;
        const accountLine: Partial<AccountLine> = {
            id: editingLine ? editingLine.id : 0,
            dateOperation: parseDDMMYYYYToDate(dateOperation),
            dateValeur: dateValeur ? parseDDMMYYYYToDate(dateValeur) : null,
            operation,
            nature,
            poste,
            solde,
            isHorsCB
        };
        try {
            await new AccountingService().createAccountingLine(accountLine);
            refresh();
            hideDialog();
        } catch (error) {
            console.error('Error creating account line', error);
        }
    };

    const footer = <div>
        <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
        <Button label="Ajouter" icon="pi pi-check" onClick={handleSubmit} />
    </div>

    if (loading) {
        return <Dialog visible header="Chargement..." style={{ width: '60vw' }} onHide={hideDialog}>
            <div>Chargement des options...</div>
        </Dialog>
    }

    return (
        <Dialog
            visible
            header={editingLine?.id ? "Modifier une dépense" :"Ajouter une dépense" }
            footer={footer}
            style={{ width: '60vw' }}
            onHide={() => hideDialog()}
        >
            <div className="flex flex-column gap-3 py-2">
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
                        <label htmlFor="dateValeur">Date de valeur <small>(facultatif)</small></label>
                    </FloatLabel>
                </div>
                <FloatLabel className='flex-1'>
                    <InputText
                        id="operation"
                        value={operation}
                        onChange={(e) => setOperation(e.target.value)}
                        className='w-full'
                    />
                    <label htmlFor="operation">Opération</label>
                </FloatLabel>
                <div className='flex gap-1'>
                    <FloatLabel className='flex-1'>
                        <Dropdown id="nature" value={nature} options={natureOptions} onChange={(e) => setNature(e.value)} placeholder="Sélectionner une nature" className='w-full' />
                        <label htmlFor="nature">Nature</label>
                    </FloatLabel>
                    <FloatLabel className='flex-1'>
                        <Dropdown id="poste" value={poste} options={posteOptions} onChange={(e) => setPoste(e.value)} placeholder="Sélectionner un poste" className='w-full' />
                        <label htmlFor="poste">Poste</label>
                    </FloatLabel>
                </div>
                <div className='flex gap-1'>
                    <FloatLabel className='flex-1'>
                        <InputNumber id="solde" value={solde} onValueChange={(e) => setSolde(e.value || 0)} mode="currency" currency="EUR" locale="fr-FR" className='w-full' />
                        <label htmlFor="solde">Montant</label>
                    </FloatLabel>
                    <div className="flex align-items-center gap-1">
                        <Checkbox id="isHorsCB" checked={isHorsCB} onChange={(e) => setIsHorsCB(e.checked || false)} />
                        <label htmlFor="isHorsCB">Hors CB</label>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}