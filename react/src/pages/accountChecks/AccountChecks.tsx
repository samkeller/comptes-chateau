import { useEffect, useMemo, useState } from "react";
import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import AccountLine from "../../interfaces/AccountLine";
import AccountingService from "../../services/AccountingService";
import { DataTableLazyState } from "../../services/tableQuery/DataTableQueryCodec";
import { FilterMatchMode, SortOrder } from "primereact/api";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { useGlobalToast } from "../../components/GlobalToast";
import DatasImport from "./DatasImport";
import { BooleanIcon } from "../../components/datatableBodys/BooleanIcon";

export default function AccountChecks() {
    const [accountLines, setAccountLines] = useState<AccountLine[]>([]);
    const [selectedLines, setSelectedLines] = useState<AccountLine[]>([]);
    const [draftDatesById, setDraftDatesById] = useState<Record<number, Date>>({});

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const showGlobalToast = useGlobalToast();

    const [lazyState, setLazyState] = useState<DataTableLazyState>({
        first: 0,
        rows: 50,
        page: 1,
        sortField: "dateOperation",
        sortOrder: -1,
        filters: {
            isChecked: { value: false, matchMode: FilterMatchMode.EQUALS }
        }
    });

    const selectedIds = useMemo(() => new Set(selectedLines.map((line) => line.id)), [selectedLines]);

    useEffect(() => {
        loadUncheckedLines();
    }, [lazyState]);

    const loadUncheckedLines = async () => {
        setLoading(true);
        try {
            const response = await new AccountingService().getAccountingLinesLazy(lazyState);
            setAccountLines(response.data);
            setTotalRecords(response.totalRecords);

            setSelectedLines((previousSelection) =>
                previousSelection.filter((selectedLine) => response.data.some((line) => line.id === selectedLine.id))
            );
            setDraftDatesById((previousDrafts) => {
                const availableIds = new Set(response.data.map((line) => line.id));
                return Object.fromEntries(
                    Object.entries(previousDrafts).filter(([id]) => availableIds.has(Number(id)))
                );
            });
        } finally {
            setLoading(false);
        }
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
        }
    };

    return (
        <PageTemplate pageTitle="Vérifications opérations">
            <div className="flex flex-column gap-3">
                <Card>
                    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                        <div>
                            <h2 className="m-0 text-2xl">Vérifier les opérations</h2>
                            <p className="m-0 text-500">Coche les opérations arrivées sur le compte, ajuste la date de valeur puis valide en lot.</p>
                        </div>
                        <div>
                            <DatasImport />
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Button
                                label={`Valider la sélection (${selectedLines.length})`}
                                icon="pi pi-check"
                                onClick={submitBatchCheck}
                                loading={submitting}
                                disabled={selectedLines.length === 0 || loading || submitting}
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <DataTable<AccountLine[]>
                        value={accountLines}
                        dataKey="id"
                        lazy
                        loading={loading}
                        selectionMode="checkbox"
                        selection={selectedLines}
                        onSelectionChange={onSelectionChange}
                        selectionPageOnly
                        totalRecords={totalRecords}
                        paginator
                        rows={lazyState.rows}
                        first={lazyState.first}
                        rowsPerPageOptions={[10, 25, 50]}
                        paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                        currentPageReportTemplate="{first}-{last} sur {totalRecords} opérations à vérifier"
                        onPage={(event: DataTablePageEvent) => setLazyState((previousState) => ({
                            ...previousState,
                            first: event.first,
                            rows: event.rows,
                            page: (event.page ?? 0) + 1
                        }))}
                        onSort={(event) => setLazyState((previousState) => ({
                            ...previousState,
                            sortField: event.sortField,
                            sortOrder: event.sortOrder as SortOrder
                        }))}
                        sortField={lazyState.sortField}
                        sortOrder={lazyState.sortOrder}
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
                            sortable
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
            </div>
        </PageTemplate>
    );
}
