import { useCallback, useEffect, useMemo, useState } from "react";
import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { DataTable, DataTableSelectionMultipleChangeEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import AccountLine from "../../interfaces/AccountLine";
import AccountLineService from "../../services/AccountLineService";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { useGlobalToast } from "../../context/GlobalToastContext";
import BanquePostaleCsvImport from "./BanquePostaleCsvImport";
import { useAccountId } from "../../hooks/useAccountId";
import BanquePostaleImportResult, {
    BanquePostaleImportMatchingCandidate,
    BanquePostaleImportResultAmbiguous,
    BanquePostaleImportResultMatched
} from "@/interfaces/Externals/BanquePostaleImportResult";
import ImportMatchStatusTag from "./atoms/ImportMatchStatusTag";
import ImportCandidateSelect from "./molecules/ImportCandidateSelect";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";

interface AccountCheckRow {
    accountLine: AccountLine;
    importResult: AccountChecksImportMapResult | null;
}

interface AccountChecksImportMapResult {
    result: BanquePostaleImportResultMatched | BanquePostaleImportResultAmbiguous;
    selectedCandidate: BanquePostaleImportMatchingCandidate | null;
}

export default function AccountChecks() {
    const accountId = useAccountId();
    const [accountLines, setAccountLines] = useState<AccountLine[]>([]);
    /**
     * Map associant l'ID d'une ligne de compte à son résultat d'import CSV correspondant.
     */
    const [importResultMap, setImportResultMap] = useState<Record<number, AccountChecksImportMapResult>>({});

    /**
     * Détermine s'il faut afficher la colonne des résultats d'import.
     */
    const showImportResultColumn = useMemo(() => {
        const [keys, values] = [Object.keys(importResultMap), Object.values(importResultMap)];
        // Si le tableau n'est pas vide
        return Object.keys(keys).length > 0
            // Et qu'il existe au moins un candidat dans tous les candidats du tableau.
            && values.some(v => {
                return (v.result as BanquePostaleImportResultMatched).candidate !== null
                    || (v.result as BanquePostaleImportResultAmbiguous).candidates.length > 0
            })
    }, [importResultMap]);

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const showGlobalToast = useGlobalToast();

    const selectedLines: AccountCheckRow[] = useMemo(() => accountLines.filter((line) => line.isChecked).map((line) => ({
        accountLine: line,
        importResult: importResultMap[line.id] ?? null
    })), [accountLines, importResultMap]);


    const displayedRows = useMemo<AccountCheckRow[]>(
        () => accountLines.map((accountLine) => ({
            accountLine,
            importResult: importResultMap[accountLine.id] ?? null
        })),
        [accountLines, importResultMap]
    );

    const loadUncheckedLines = useCallback(async (): Promise<void> => {
        setLoading(true);

        try {
            const lines = await new AccountLineService().getAllUncheckedLines(accountId);
            setImportResultMap({});
            setAccountLines(lines);
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        loadUncheckedLines();
    }, [loadUncheckedLines]);


    const handleCsvImport = (prefillResult: BanquePostaleImportResult) => {
        const nextImportResultMap: Record<number, AccountChecksImportMapResult> = {};

        for (const matchedResult of prefillResult.matched) {
            nextImportResultMap[matchedResult.accountLineId] = {
                result: matchedResult,
                selectedCandidate: matchedResult.candidate
            };
        }
        for (const ambiguousResult of prefillResult.ambiguous) {
            nextImportResultMap[ambiguousResult.accountLineId] = {
                result: ambiguousResult,
                selectedCandidate: null
            };
        }

        setImportResultMap(nextImportResultMap);

        setAccountLines((previousLines) => previousLines.map((line) => {
            const matchedResult = nextImportResultMap[line.id];
            if (!matchedResult || matchedResult.result.type !== "matched") {
                return line;
            }

            return new AccountLine({
                ...line,
                isChecked: true,
                dateValeur: matchedResult.result.candidate.dateOperation
            });
        }));

        showGlobalToast({
            severity: "success",
            summary: "Relevé importé",
            detail: `${prefillResult.linesCreated} ligne(s) de relevé enregistrée(s), ${prefillResult.matched.length} date(s) proposée(s).`
        });
    };

    const selectImportCandidate = (
        lineId: number,
        candidate: BanquePostaleImportMatchingCandidate
    ): void => {
        setImportResultMap((previous) => ({
            ...previous,
            [lineId]: {
                ...previous[lineId],
                selectedCandidate: candidate
            }
        }));
        setAccountLines((previousLines) => previousLines.map((line) =>
            line.id === lineId
                ? new AccountLine({ ...line, isChecked: true, dateValeur: candidate.dateOperation })
                : line
        ));
    };

    const onSelectionChange = (event: DataTableSelectionMultipleChangeEvent<AccountCheckRow[]>) => {
        const nextSelectedIds = new Set((event.value).map((row) => row.accountLine.id));

        setAccountLines((prev) =>
            prev.map((line) => {
                // Ligne déjà sélectionnée -> pas de changement
                const shouldBeChecked = nextSelectedIds.has(line.id);
                if (shouldBeChecked === line.isChecked) {
                    return line;
                }
                // Sinon, checker/déchecker la ligne et mettre à jour la date de valeur si besoin
                return new AccountLine({
                    ...line,
                    isChecked: shouldBeChecked,
                    dateValeur: shouldBeChecked ? (line.dateValeur ?? new Date()) : line.dateValeur
                });
            })
        );
    };

    const updateDateForLine = (lineId: number, date: Date | null) => {
        if (!date) {
            return;
        }

        setAccountLines((prev) =>
            prev.map((line) =>
                line.id === lineId
                    ? new AccountLine({
                        ...line,
                        isChecked: true, // On a choisi une date -> On check   
                        dateValeur: date
                    })
                    : line
            )
        );
    };

    const submitBatchCheck = () => {
        if (selectedLines.length === 0) {
            return;
        }

        setSubmitting(true);
        new AccountLineService()
            .checkBatch(
                accountId,
                selectedLines.map((line) => ({
                    id: line.accountLine.id,
                    isChecked: true,
                    dateValeur: line.accountLine.dateValeur ?? new Date()
                }))
            )
            .then(async () => {
                showGlobalToast({
                    severity: "success",
                    summary: "Validation effectuée",
                    detail: `${selectedLines.length} opération(s) validée(s).`
                });

                return await loadUncheckedLines();
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <PageTemplate pageTitle="Vérifications opérations">
            <Card
                title={
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="m-0 text-xl">Opérations à vérifier</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <BanquePostaleCsvImport
                                accountId={accountId}
                                disabled={loading || submitting}
                                afterImportResults={handleCsvImport}
                            />
                            <Button
                                label={`Valider (${selectedLines.length})`}
                                icon="pi pi-check"
                                onClick={submitBatchCheck}
                                loading={submitting}
                                disabled={selectedLines.length === 0 || loading || submitting}
                            />
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <FillRemainingHeight offset={65}>
                        <DataTable<AccountCheckRow[]>
                            id="accountchecks-datatable"
                            value={displayedRows}
                            dataKey={(row) => row.accountLine.id}
                            loading={loading}
                            selectionMode="checkbox"
                            selection={selectedLines}
                            onSelectionChange={onSelectionChange}
                            // Scrollable
                            scrollable
                            scrollHeight="flex"
                            emptyMessage="Aucune opération à vérifier."
                        >
                            <Column
                                selectionMode="multiple"
                                style={{ width: "3.5rem" }}
                            />
                            <Column
                                field="accountLine.dateOperation"
                                header="Date opération"
                                sortable
                                body={(line: AccountCheckRow) => line.accountLine.displayDateOperation}
                                style={{ width: "12rem" }}
                            />
                            <Column
                                field="accountLine.label"
                                header="Opération"
                                body={(line: AccountCheckRow) => {
                                    return (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>{line.accountLine.label}</span>
                                        </div>
                                    );
                                }}
                                style={{ minWidth: "15rem" }}
                            />
                            <Column
                                field="accountLine.amount"
                                header="Montant"
                                body={(line: AccountCheckRow) => toMonetaryAmount(line.accountLine.total)}
                                style={{ width: "10rem" }}
                            />
                            <Column
                                field="accountLine.dateValeur"
                                header="Date valeur"
                                body={(line: AccountCheckRow) => (
                                    <Calendar
                                        value={line.accountLine.dateValeur}
                                        onChange={(event) => updateDateForLine(line.accountLine.id, event.value ?? null)}
                                        dateFormat="dd/mm/yy"
                                        className="w-full"
                                    />
                                )}
                                style={{ width: "14rem" }}
                            />
                            {
                                showImportResultColumn &&
                                <Column
                                    field="importResult"
                                    header="Libellé de l'import"
                                    body={(line: AccountCheckRow) => {
                                        // Pas de résultat -> Rien
                                        if (!line.importResult) {
                                            return null;
                                        }

                                        // Un seul résultat -> L'affiche
                                        if (line.importResult.result.type === "matched") {
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <ImportMatchStatusTag status="unique" />
                                                    <span className="text-sm text-surface-500">{line.importResult.result.candidate.label}</span>
                                                </div>
                                            );
                                        }

                                        // Plusieurs résultats -> Dropdown
                                        return (
                                            <div className="flex flex-col gap-1">
                                                <ImportMatchStatusTag
                                                    status={
                                                        line.accountLine.isChecked
                                                            ? "choice-selected"
                                                            : "choice-required"
                                                    } />

                                                <ImportCandidateSelect
                                                    candidates={line.importResult.result.candidates}
                                                    selectedCandidateId={line.importResult.selectedCandidate?.id ?? null}
                                                    onChange={(candidate) => selectImportCandidate(line.accountLine.id, candidate)}
                                                />
                                            </div>
                                        );
                                    }}
                                    style={{ width: "10rem" }}
                                />
                            }
                        </DataTable>
                    </FillRemainingHeight>
                </div>
            </Card>
        </PageTemplate >
    );
}
