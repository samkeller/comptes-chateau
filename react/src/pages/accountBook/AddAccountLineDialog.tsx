import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { FloatLabel } from "primereact/floatlabel";
import { ToggleButton } from "primereact/togglebutton";
import AccountLine from "../../interfaces/AccountLine";
import Account from "../../interfaces/Account";
import AccountLineNatureDropdown from "../../components/atoms/accountLine/AccountLineNatureDropdown";
import AccountLinePosteDropdown from "@/components/atoms/accountLine/AccountLinePosteDropdown";
import AccountLineService from "../../services/AccountLineService";
import AccountService from "../../services/AccountService";
import { parseDateToDDMMYYYY, parseDDMMYYYYToDate } from "../../utils/DatesUtils";
import { useGlobalToast } from "../../context/GlobalToastContext";
import { useScreen } from "@/hooks/useScreen";
import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import AccountLineCategorizationService from "@/services/AccountLineCategorizationService";
import { AccountLineRule } from "@/interfaces/AccountLineRule";
import { useAccountId } from "@/hooks/useAccountId";
import { generatePath, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { routePaths } from "@/routes/routePaths";
import Optional from "@/components/atoms/form/Optional";

const accountService = new AccountService();
const accountLineCategorizationService = new AccountLineCategorizationService();
const accountLineService = new AccountLineService()

export default function AddAccountLineDialog() {

    const accountId = useAccountId();
    const { accountLineId } = useParams<{ accountLineId: string | "new" }>();
    const isEditing = accountLineId && accountLineId !== "new";
    const navigate = useNavigate();
    /**
     * Permet de rafraichir la liste des lignes de compte après l'ajout ou la modification d'une ligne.
     * Cette fonction est fournie par le composant parent via le contexte de l'outlet.
     * Elle est utilisée pour déclencher un rafraichissement de la liste des lignes de compte après l'ajout ou la modification d'une ligne.
     */
    const { refresh } = useOutletContext<{
        refresh: () => Promise<void>;
    }>();

const [dateOperation, setDateOperation] = useState<string>(parseDateToDDMMYYYY(new Date()));
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const [dateValeur, setDateValeur] = useState<string>("");
    const [operationLabel, setOperationLabel] = useState<string>("");
    const [suggestedOperations, setSuggestedOperations] = useState<AccountLineRule[]>([]);
    const [natureId, setNatureId] = useState<number | null>(null);
    const [posteId, setPosteId] = useState<number | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [targetAccount, setTargetAccount] = useState<Account | null>(null);

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const showGlobalToast = useGlobalToast();
    const { isMobile, isTablet } = useScreen();

    useEffect(() => {
        const fetchData = async () => {
            // Charge la ligne de compte si un ID est fourni et qu'il n'est pas "new"
            if (isEditing) {
                const line = await accountLineService.getAccountLine(accountId, parseInt(accountLineId));
                setDateOperation(parseDateToDDMMYYYY(line.dateOperation));
                setIsChecked(line.isChecked);
                setDateValeur(line.dateValeur ? parseDateToDDMMYYYY(line.dateValeur) : "");
                setOperationLabel(line.label);
                setNatureId(line.nature?.id ?? null);
                setPosteId(line.poste?.id ?? null);
                setAmount((line.credit || 0) - (line.debit || 0));
                setTargetAccount(line.targetAccount || null);
            }

            // Charge la liste des comptes pour le dropdown
            const accounts = await accountService.getAllAccounts();
            setAccounts(accounts);
            setLoading(false);
        };

        fetchData();
    }, [accountId, accountLineId]);

    const targetAccountOptions = accounts
        .filter((a) => a.id !== accountId)
        .map((value) => ({ label: value.label, value }));

    const handleSubmit = () => {
        if (!dateOperation) {
            return;
        }

        const accountLine: Partial<AccountLine> = {
            id: accountLineId && accountLineId !== "new" ? parseInt(accountLineId) : 0,
            dateOperation: parseDDMMYYYYToDate(dateOperation),
            isChecked,
            dateValeur: isChecked ? (dateValeur ? parseDDMMYYYYToDate(dateValeur) : new Date()) : null,
            label: operationLabel,
            natureId,
            posteId,
            debit: amount < 0 ? (Math.abs(amount) || 0) : 0,
            credit: amount > 0 ? (amount || 0) : 0,
            targetAccount: targetAccount ?? null,
        };

        accountLineService
            .saveAccountLine(accountId, accountLine)
            .then(() => refresh()) // Rafraichit la liste des lignes de compte après l'ajout ou la modification
            .then(() => {
                showGlobalToast({
                    severity: "success",
                    summary: accountLineId && accountLineId !== "new" ? "Dépense modifiée" : "Dépense ajoutée",
                    detail: accountLineId && accountLineId !== "new" ? "La dépense a été modifiée avec succès." : "La dépense a été ajoutée avec succès."
                });
                navigate(generatePath(routePaths.account.accountBook, {
                    accountId: String(accountId),
                }), {
                    replace: true
                });

            })
    };

    /**
     *  Cherches les suggestions d'opérations correspondant au pattern fourni (LIKE).
     * @param event 
     */
    async function searchOperationsSuggestions(event: AutoCompleteCompleteEvent): Promise<void> {
        const query = event.query.trim().toLowerCase();
        const results = await accountLineCategorizationService.search(query);

        setSuggestedOperations(results);
    }

    /**
     * Met à jour le label de l'opération et les informations de poste et nature associées à l'opération suggérée.
     * @param event 
     */
    function changeOperationLabelAutocomplete(event: AutoCompleteChangeEvent<string>): void {
        setOperationLabel(event.value ?? "");

        // Récupères les informations de poste et nature associées à l'opération suggérée
        const suggestedOperation = suggestedOperations.find((op) => op.pattern === event.value);

        if (suggestedOperation) {
            setNatureId(suggestedOperation.natureId ?? null);
            setPosteId(suggestedOperation.posteId ?? null);
        }
    }

    /**
     *  Masque le dialogue d'ajout/modification d'une ligne de compte.
     */
    const hideDialog = () => navigate(-1)

    const footer = (
        <div>
            <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label={isEditing ? "Modifier" : "Ajouter"} icon="pi pi-check" onClick={handleSubmit} />
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
            header={isEditing ? "Modifier une dépense" : "Ajouter une dépense"}
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
                    <AutoComplete
                        id="operation"
                        value={operationLabel}
                        onChange={changeOperationLabelAutocomplete}
                        completeMethod={searchOperationsSuggestions} // Autocomplete search method
                        suggestions={suggestedOperations.map(v => v.label)} // Suggestions autocomplete
                        className="w-full"
                        inputClassName="w-full"
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
                        <label htmlFor="nature">Nature <Optional /></label>
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
                        <label htmlFor="poste">Poste <Optional /></label>
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
                    <label htmlFor="targetAccount">Compte lié <Optional /></label>
                </FloatLabel>
            </div>
        </Dialog>
    );
}
