import { Dialog } from 'primereact/dialog';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import AccountLine from '../../interfaces/AccountLine';
import AccountLineNature from '../../interfaces/enums/AccountLineNature';
import AccountLinePoste from '../../interfaces/enums/AccountLinePoste';
import AccountingService from '../../services/AccountingService';
import { FloatLabel } from 'primereact/floatlabel';
import { parseDateToDDMMYYYY, parseDDMMYYYYToDate } from '../../Utils/DatesUtils';

interface AddAcountLineDialogProps {
    hideDialog: () => void;
    refresh: () => void;
}

export default function AddAccountLineDialog({ hideDialog, refresh: onAdd }: AddAcountLineDialogProps) {
    const [dateOperation, setDateOperation] = useState<string>("");
    const [dateValeur, setDateValeur] = useState<string>("");
    const [operation, setOperation] = useState<string>('');
    const [nature, setNature] = useState<AccountLineNature>(AccountLineNature.UNKNOWN);
    const [poste, setPoste] = useState<AccountLinePoste>(AccountLinePoste.UNKNOWN);
    const [solde, setSolde] = useState<number>(0);
    const [isHorsCB, setIsHorsCB] = useState<boolean>(false);

    const natureOptions = Object.values(AccountLineNature).filter(v => v !== '').map(v => ({ label: v, value: v }));
    const posteOptions = Object.values(AccountLinePoste).filter(v => v !== '').map(v => ({ label: v, value: v }));

    const handleSubmit = async () => {
        if (!dateOperation) return;
        const accountLine: Partial<AccountLine> = {
            dateOperation,
            dateValeur,
            operation,
            nature,
            poste,
            solde,
            isHorsCB
        };
        try {
            await new AccountingService().createAccountingLine(accountLine);
            onAdd();
            hideDialog();
        } catch (error) {
            console.error('Error creating account line', error);
        }
    };

    const footer = <div>
        <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
        <Button label="Ajouter" icon="pi pi-check" onClick={handleSubmit} />
    </div>

    return (
        <Dialog
            visible
            header="Ajouter une ligne comptable"
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