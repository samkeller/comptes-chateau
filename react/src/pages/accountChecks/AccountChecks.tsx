import { useEffect, useMemo, useState } from "react";
import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { DataTable, DataTableSelectionMultipleChangeEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import AccountLine from "../../interfaces/AccountLine";
import AccountingService from "../../services/AccountingService";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { useGlobalToast } from "../../context/GlobalToastContext";
import BanquePostaleCsvImport from "./BanquePostaleCsvImport";
import { BooleanIcon } from "../../components/datatableBodys/BooleanIcon";
import { BanquePostaleCsvData } from "../../utils/banquePostaleCsv";
import { buildBanquePostalePrefillResult, BanquePostaleImportReport } from "./banquePostaleImportMatching";
import BanquePostaleImportReportPanel from "./BanquePostaleImportReportPanel";

export default function AccountChecks() {
    const [accountLines, setAccountLines] = useState<AccountLine[]>([]);
    const [importReport, setImportReport] = useState<BanquePostaleImportReport | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const showGlobalToast = useGlobalToast();

    const selectedLines = useMemo(() => accountLines.filter((line) => line.isChecked), [accountLines]);

    useEffect(() => {
        loadUncheckedLines();
    }, []);


    const loadUncheckedLines = async () => {
        setLoading(true);
        new AccountingService().getAllUncheckedLines()
            .then(setAccountLines)
            .catch((error) => {
                console.error("Error while loading unchecked operations", error);
                showGlobalToast({
                    severity: "error",
                    summary: "Chargement impossible",
                    detail: "Les opérations à vérifier n'ont pas pu être chargées."
                });
            }).finally(() => {
                setLoading(false);
            });

    }

    const handleCsvImport = (csvData: BanquePostaleCsvData) => {
        const prefillResult = buildBanquePostalePrefillResult(csvData, accountLines);

        setAccountLines((prev) =>
            prev.map((line) => {
                // Si la ligne est dans les résultats du pré-remplissage, on la marque comme cochée et on met à jour sa date de valeur.
                if (prefillResult.selectedOperationIds.has(line.id)) {
                    return new AccountLine({
                        ...line,
                        isChecked: true,
                        dateValeur: prefillResult.draftDatesById[line.id]
                    });
                }
                return line;
            })
        );

        setImportReport(prefillResult.report);

        const appliedCount = prefillResult.report.appliedMatches.length;
        const ambiguousCount = prefillResult.report.ambiguities.length;

        showGlobalToast({
            severity: appliedCount > 0 ? "success" : "warn",
            summary: "Import CSV terminé",
            detail: `${appliedCount} pré-remplissage(s) appliqué(s), ${ambiguousCount} montant(s) ambigu(s).`
        });
    };

    const handleCsvImportError = (message: string) => {
        showGlobalToast({
            severity: "error",
            summary: "Import CSV invalide",
            detail: message
        });
    };

    const onSelectionChange = (event: DataTableSelectionMultipleChangeEvent<AccountLine[]>) => {
        const nextSelectedIds = new Set((event.value).map((line) => line.id));

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
                    ? new AccountLine({ ...line, dateValeur: date })
                    : line
            )
        );
    };

    const submitBatchCheck = async () => {
        if (selectedLines.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            await new AccountingService().checkBatch(
                selectedLines.map((line) => ({
                    id: line.id,
                    isChecked: true,
                    dateValeur: line.dateValeur ?? new Date()
                }))
            );

            showGlobalToast({
                severity: "success",
                summary: "Validation effectuée",
                detail: `${selectedLines.length} opération(s) validée(s).`
            });

            await loadUncheckedLines();
        } catch (error) {
            console.error("Error while checking operations", error);
            showGlobalToast({
                severity: "error",
                summary: "Echec de la validation",
                detail: "La validation en lot a échoué."
            });
        } finally {
            setSubmitting(false);
            setImportReport(null);
        }
    };

    return (
        <PageTemplate pageTitle="Vérifications opérations">
            <div className="flex flex-col gap-6">
                <Card>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h2 className="m-0 text-2xl">Vérifier les opérations</h2>
                                <p className="m-0 text-surface-600 leading-normal">
                                    - Mode manuel: sélectionne dans le tableau puis valide. <br />
                                    - Import CSV: optionnel pour pré-remplir.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    label={`Valider (${selectedLines.length})`}
                                    icon="pi pi-check"
                                    onClick={submitBatchCheck}
                                    loading={submitting}
                                    disabled={selectedLines.length === 0 || loading || submitting}
                                />
                            </div>
                        </div>


                    </div>
                </Card>
                <Card>
                    <div className="flex flex-col gap-6">
                        <BanquePostaleCsvImport
                            disabled={loading || submitting}
                            onImport={handleCsvImport}
                            onError={handleCsvImportError}
                            onImportStart={() => setImportReport(null)}
                        />
                        {importReport && (
                            <BanquePostaleImportReportPanel
                                report={importReport}
                                close={() => setImportReport(null)}
                            />
                        )}
                    </div>
                    <div className="border-t border-surface my-12" />
                    <DataTable<AccountLine[]>
                        value={accountLines}
                        dataKey="id"
                        loading={loading}
                        selectionMode="checkbox"
                        selection={selectedLines}
                        onSelectionChange={onSelectionChange}
                        scrollable
                        scrollHeight="70vh"
                        emptyMessage="Aucune opération à vérifier."
                    >
                        <Column selectionMode="multiple" style={{ width: "3.5rem" }} />
                        <Column
                            field="dateOperation"
                            header="Date opération"
                            sortable
                            body={(line: AccountLine) => line.displayDateOperation}
                            style={{ width: "12rem" }}
                        />
                        <Column
                            field="label"
                            header="Opération"
                        />
                        <Column
                            field="isHorsCompte"
                            header="Hors compte"
                            body={BooleanIcon}
                        />
                        <Column
                            field="amount"
                            header="Montant"
                            body={(line: AccountLine) => toMonetaryAmount(line.total)}
                            style={{ width: "10rem" }}
                        />
                        <Column
                            header="Date valeur"
                            body={(line: AccountLine) => (
                                <Calendar
                                    value={line.dateValeur}
                                    onChange={(event) => updateDateForLine(line.id, event.value ?? null)}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                    disabled={!line.isChecked}
                                />
                            )}
                            style={{ width: "14rem" }}
                        />
                    </DataTable>
                </Card>
            </div >
        </PageTemplate >
    );
}
