import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { FloatLabel } from "primereact/floatlabel";
import { ToggleButton } from "primereact/togglebutton";
import AccountLine from "../../interfaces/AccountLine";
import Account from "../../interfaces/Account";
import AccountLineNatureDropdown from "../../components/atoms/accountLine/AccountLineNatureDropdown";
import AccountLinePosteDropdown from "@/components/atoms/accountLine/AccountLinePosteDropdown";
import AccountingService from "../../services/AccountingService";
import AccountService from "../../services/AccountService";
import { parseDateToDDMMYYYY, parseDDMMYYYYToDate } from "../../utils/DatesUtils";
import { useGlobalToast } from "../../context/GlobalToastContext";
import { useScreen } from "@/utils/hooks/useScreen";

interface AddAcountLineDialogProps {
    accountId: number;
    editingLine: AccountLine | null;
    hideDialog: () => void;
    refresh: () => void;
}

export default function AddAccountLineDialog({ accountId, editingLine, hideDialog, refresh }: AddAcountLineDialogProps) {
    const [dateOperation, setDateOperation] = useState<string>(editingLine ? parseDateToDDMMYYYY(editingLine.dateOperation) : parseDateToDDMMYYYY(new Date()));
    const [isChecked, setIsChecked] = useState<boolean>(editingLine?.isChecked ?? false);
    const [dateValeur, setDateValeur] = useState<string>(editingLine && editingLine.dateValeur ? parseDateToDDMMYYYY(editingLine.dateValeur) : "");
    const [label, setLabel] = useState<string>(editingLine?.label || "");
    const [natureId, setNatureId] = useState<number | null>(editingLine?.nature?.id || null);
    const [posteId, setPosteId] = useState<number | null>(editingLine?.poste?.id || null);
    const [amount, setAmount] = useState<number>((editingLine?.credit || 0) - (editingLine?.debit || 0));
    const [targetAccount, setTargetAccount] = useState<Account | null>(editingLine?.targetAccount || null);

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const showGlobalToast = useGlobalToast();
    const { isMobile, isTablet } = useScreen();

    useEffect(() => {
        const accountService = new AccountService();
        Promise.all([
            accountService.getAllAccounts()
        ]).then(([accountsData]) => {
            setAccounts(accountsData);
            setLoading(false);
        });
    }, [editingLine, accountId]);

    const targetAccountOptions = accounts
        .filter((a) => a.id !== accountId)
        .map((value) => ({ label: value.label, value }));



    const handleSubmit = () => {
        if (!dateOperation) {
            return;
        }

        const accountLine: Partial<AccountLine> = {
            id: editingLine ? editingLine.id : 0,
            dateOperation: parseDDMMYYYYToDate(dateOperation),
            isChecked,
            dateValeur: isChecked ? (dateValeur ? parseDDMMYYYYToDate(dateValeur) : new Date()) : null,
            label,
            natureId,
            posteId,
            debit: amount < 0 ? (Math.abs(amount) || 0) : 0,
            credit: amount > 0 ? (amount || 0) : 0,
            targetAccount: targetAccount ?? null,
        };

        new AccountingService()
            .saveAccountLine(accountId, accountLine)
            .then(() => {
                refresh();
                showGlobalToast({
                    severity: "success",
                    summary: editingLine ? "Dépense modifiée" : "Dépense ajoutée",
                    detail: editingLine ? "La dépense a été modifiée avec succès." : "La dépense a été ajoutée avec succès."
                });
                hideDialog();
            })
    };

    const footer = (
        <div>
            <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label={editingLine?.id ? "Modifier" : "Ajouter"} icon="pi pi-check" onClick={handleSubmit} />
        </div>
    );

    if (loading) {
        return (
            <Dialog visible header="Chargement..." style={{ width: "60vw" }} onHide={hideDialog}>
                <div>Chargement des options...</div>
            </Dialog>
        );
    }

    return (
        <Dialog
            visible
            header={editingLine?.id ? "Modifier une dépense" : "Ajouter une dépense"}
            footer={footer}
            style={{ width: isMobile || isTablet ? "90vw" : "60vw" }}
            onHide={hideDialog}
        >
            <div className="flex flex-col gap-12 pt-12">
                <div className="flex gap-1">
                    <FloatLabel className="flex-1">
                        <Calendar
                            id="dateOperation"
                            value={dateOperation ? parseDDMMYYYYToDate(dateOperation) : null}
                            onChange={(e) => e.value && setDateOperation(parseDateToDDMMYYYY(e.value))}
                            dateFormat="dd/mm/yy"
                            className="w-full"
                        />
                        <label htmlFor="dateOperation">Date d'opération</label>
                    </FloatLabel>
                </div>
                <div className="flex items-center gap-2">
                    <ToggleButton
                        onIcon="pi pi-check"
                        offIcon="pi pi-times"
                        onLabel="Vérifié"
                        offLabel="Non vérifié"
                        checked={isChecked}
                        onChange={(event) => {
                            setIsChecked(event.value);
                            if (event.value) {
                                if (!dateValeur) {
                                    setDateValeur(parseDateToDDMMYYYY(new Date()));
                                }
                                return;
                            }

                            setDateValeur("");
                        }}
                    />
                    <FloatLabel className="flex-1">
                        <Calendar
                            id="dateValeur"
                            value={dateValeur ? parseDDMMYYYYToDate(dateValeur) : null}
                            onChange={(e) => e.value && setDateValeur(parseDateToDDMMYYYY(e.value))}
                            dateFormat="dd/mm/yy"
                            className="w-full"
                            disabled={!isChecked}
                        />
                        <label htmlFor="dateValeur">Date de valeur</label>
                    </FloatLabel>


                </div>

                <FloatLabel className="flex-1">
                    <InputText
                        id="operation"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full"
                    />
                    <label htmlFor="operation">Opération</label>
                </FloatLabel>

                <div className="flex gap-1">
                    <FloatLabel className="flex-1">
                        <AccountLineNatureDropdown
                            id="nature"
                            value={natureId}
                            onChange={(e) => setNatureId(e.value ?? null)}
                            className="w-full"
                            showClear
                        />
                        <label htmlFor="nature">Nature <small>(optionnel)</small></label>
                    </FloatLabel>

                    <FloatLabel className="flex-1">
                        <AccountLinePosteDropdown
                            id="poste"
                            accountId={accountId}
                            value={posteId}
                            onChange={(e) => setPosteId(e.value ?? null)}
                            className="w-full"
                            showClear
                        />
                        <label htmlFor="poste">Poste <small>(optionnel)</small></label>
                    </FloatLabel>
                </div>

                <div className="flex gap-2">
                    <FloatLabel className="flex-1">
                        <InputNumber
                            id="amount"
                            value={amount}
                            onValueChange={(e) => setAmount(e.value || 0)}
                            mode="currency"
                            currency="EUR"
                            locale="fr-FR"
                            className="w-full"
                            invalid={amount === 0}
                        />
                        <label htmlFor="amount">Montant</label>
                    </FloatLabel>

                    <div className="flex items-center">
                        <small>{amount < 0 ? "Débit" : "Crédit"}</small>
                    </div>
                </div>
                <FloatLabel className="flex-1">
                    <Dropdown
                        id="targetAccount"
                        value={targetAccount}
                        options={targetAccountOptions}
                        onChange={(e) => setTargetAccount(e.value ?? null)}
                        placeholder="Aucun"
                        className="w-full"
                        dataKey="id"
                        showClear
                    />
                    <label htmlFor="targetAccount">Compte lié <small>(optionnel)</small></label>
                </FloatLabel>
            </div>
        </Dialog>
    );
}
