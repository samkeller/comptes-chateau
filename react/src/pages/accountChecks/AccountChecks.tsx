import { useEffect, useMemo, useState } from "react";
import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AccountLine from "../../interfaces/AccountLine";
import AccountingService from "../../services/AccountingService";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { useGlobalToast } from "../../components/GlobalToast";
import BanquePostaleCsvImport from "./BanquePostaleCsvImport";
import { BooleanIcon } from "../../components/datatableBodys/BooleanIcon";
import { BanquePostaleCsvData } from "../../utils/banquePostaleCsv";
import { buildBanquePostalePrefillResult, BanquePostaleImportReport } from "./banquePostaleImportMatching";
import BanquePostaleImportReportPanel from "./BanquePostaleImportReportPanel";

export default function AccountChecks() {
    const [accountLines, setAccountLines] = useState<AccountLine[]>([]);
    const [selectedLines, setSelectedLines] = useState<AccountLine[]>([]);
    const [draftDatesById, setDraftDatesById] = useState<Record<number, Date>>({});
    const [importReport, setImportReport] = useState<BanquePostaleImportReport | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const showGlobalToast = useGlobalToast();

    const selectedIds = useMemo(() => new Set(selectedLines.map((line) => line.id)), [selectedLines]);

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

        const lineById = new Map(accountLines.map((line) => [line.id, line]));

        setSelectedLines((previousSelection) => {
            const mergedIds = new Set(previousSelection.map((line) => line.id));
            prefillResult.selectedOperationIds.forEach((id) => mergedIds.add(id));

            return Array.from(mergedIds)
                .map((id) => lineById.get(id))
                .filter((line): line is AccountLine => Boolean(line));
        });

        setDraftDatesById((previousDrafts) => ({
            ...previousDrafts,
            ...prefillResult.draftDatesById
        }));

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

    const onSelectionChange = (event: { value: AccountLine[] | null }) => {
        const nextSelection = event.value ?? [];
        const nextSelectionIds = new Set(nextSelection.map((line: AccountLine) => line.id));

        setSelectedLines(nextSelection);
        setDraftDatesById((previousDrafts) => {
            const nextDrafts: Record<number, Date> = {};

            nextSelection.forEach((line: AccountLine) => {
                nextDrafts[line.id] = previousDrafts[line.id] ?? new Date();
            });

            return nextDrafts;
        });

        if (nextSelectionIds.size === 0) {
            setDraftDatesById({});
        }
    };

    const updateDateForLine = (lineId: number, date: Date | null) => {
        if (!date) {
            return;
        }

        setDraftDatesById((previousDrafts) => ({
            ...previousDrafts,
            [lineId]: date
        }));
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
                    dateValeur: draftDatesById[line.id] ?? new Date()
                }))
            );

            showGlobalToast({
                severity: "success",
                summary: "Validation effectuée",
                detail: `${selectedLines.length} opération(s) validée(s).`
            });

            setSelectedLines([]);
            setDraftDatesById({});
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
            <div className="flex flex-column gap-3">
                <Card>
                    <div className="flex flex-column gap-3">
                        <div className="flex flex-column lg:flex-row lg:align-items-center lg:justify-content-between gap-3">
                            <div>
                                <h2 className="m-0 text-2xl">Vérifier les opérations</h2>
                                <p className="m-0 text-600 line-height-3">
                                    - Mode manuel: sélectionne dans le tableau puis valide. <br />
                                    - Import CSV: optionnel pour pré-remplir.
                                </p>
                            </div>

                            <div className="flex flex-wrap align-items-center gap-2">
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
                    <div className="flex flex-column gap-3">
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
                    <div className="border-top-1 surface-border my-4" />
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
                                    value={draftDatesById[line.id] ?? null}
                                    onChange={(event) => updateDateForLine(line.id, event.value ?? null)}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                    disabled={!selectedIds.has(line.id)}
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
