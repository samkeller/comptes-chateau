import { useEffect, useState } from "react"
import AccountLine from "../../interfaces/AccountLine"
import { DataTable, DataTablePageEvent } from "primereact/datatable"
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column"
import { Card } from "primereact/card"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Calendar } from "primereact/calendar"
import AccountLineNatureDropdown from "../../components/atoms/accountLine/AccountLineNatureDropdown";
import AccountLinePosteDropdown from "../../components/atoms/accountLine/AccountLinePosteDropdown";
import { PageTemplate } from "../PageTemplate"
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel"
import AccountLineService from "../../services/AccountLineService"
import { FilterMatchMode, SortOrder } from "primereact/api"
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Tooltip } from "primereact/tooltip"
import { DataTableLazyState } from "../../services/tableQuery/DataTableQueryCodec"
import { BooleanIcon } from "../../components/datatableBodys/BooleanIcon"
import AccountBookExportButtons from "./AccountBookExportButtons"
import { useAccountId } from "../../hooks/useAccountId"
import AccountBookActionsBody from "./molecules/AccountBookActionsBody"
import { InputNumber } from "primereact/inputnumber"
import { toMonetaryAmount } from "@/utils/NumberUtils"
import { generatePath, Outlet, useNavigate } from "react-router-dom"
import { routePaths } from "@/routes/routePaths"

const accountLineService = new AccountLineService()

export default function AccountBook() {
    const accountId = useAccountId()
    const navigate = useNavigate()

    const [accountLines, setAccountLines] = useState<AccountLine[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [totalRecords, setTotalRecords] = useState<number>(0)

    const [lazyState, setLazyState] = useState<DataTableLazyState>({
        first: 0,
        rows: 50,
        page: 1,
        sortField: 'dateOperation',
        sortOrder: -1, // DESC
        filters: {
            dateValeur: { value: null, matchMode: FilterMatchMode.DATE_IS },
            dateOperation: { value: null, matchMode: FilterMatchMode.DATE_IS },
            label: { value: "", matchMode: FilterMatchMode.CONTAINS },
            'nature.id': { value: null, matchMode: FilterMatchMode.EQUALS },
            'poste.id': { value: null, matchMode: FilterMatchMode.EQUALS },
            amount: { value: "", matchMode: FilterMatchMode.EQUALS },
            isChecked: { value: null, matchMode: FilterMatchMode.EQUALS }
        }
    });

    useEffect(() => {
        loadAccountLines();
    }, [lazyState, accountId]);

    const loadAccountLines = async () => {
        setLoading(true)
        try {
            const lines = await accountLineService.getAccountLinesLazy(accountId, lazyState)
            setAccountLines(lines.data)
            setTotalRecords(lines.totalRecords)
        } finally {
            setLoading(false)
        }
    }

    const checkedRowFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        if (options.value === null) {
            // Erreur limite ? Error react.
            return <></>
        }
        return <TriStateCheckbox value={options.value} onChange={(e) => options.filterApplyCallback(e.value)} />;
    };

    return (
        <PageTemplate pageTitle="Opérations">
            {/* Dialogue d'édition */}
            <Outlet
                context={{ refresh: loadAccountLines }}
            />
            <div className="flex justify-end mb-6">
                <div className="flex flex-wrap justify-end gap-2">
                    <AccountBookExportButtons accountId={accountId} />
                    <Button label="Ajouter une dépense" icon="pi pi-plus" onClick={() => navigate(generatePath(routePaths.account.accountBookDialog, {
                        accountId: String(accountId),
                        accountLineId: "new",
                    }))} />
                </div>
            </div>
            <Card>
                <DataTable
                    value={accountLines}
                    lazy
                    loading={loading}

                    // Pagination
                    totalRecords={totalRecords}
                    paginator
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    paginatorClassName="flex-nowrap overflow-x-auto"
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    currentPageReportTemplate="{first}-{last} sur {totalRecords} opérations"
                    first={lazyState.first}
                    rows={lazyState.rows}
                    onPage={(e: DataTablePageEvent) => setLazyState(prev => ({
                        ...prev,
                        first: e.first,
                        rows: e.rows,
                        page: (e.page ?? 0) + 1
                    }))}
                    // Tri
                    onSort={e => setLazyState(prev => ({
                        ...prev,
                        sortField: e.sortField,
                        sortOrder: e.sortOrder as SortOrder
                    }))}
                    removableSort
                    sortField={lazyState.sortField}
                    sortOrder={lazyState.sortOrder}
                    // Filtres
                    filterDisplay="row"
                    filters={lazyState.filters}
                    onFilter={e => setLazyState(prev => ({
                        ...prev,
                        filters: e.filters
                    }))}

                    // Style
                    size="small"
                >
                    <Column
                        field="dateOperation"
                        dataType="date"
                        header="Date opération"
                        body={(v: AccountLine) => v ? v.displayDateOperation : null}
                        sortable
                        filter
                        filterElement={(options) => (
                            <Calendar
                                value={options.value}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                dateFormat="dd/mm/yy"
                                className="w-full"
                            />
                        )}
                        style={{ maxWidth: "200px" }}
                    ></Column>
                    <Column
                        field="dateValeur"
                        dataType="date"
                        header="Date valeur"
                        body={(v: AccountLine) => v ? v.displayDateValeur : null}
                        sortable
                        filter
                        filterElement={(options) => (
                            <Calendar
                                value={options.value}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                dateFormat="dd/mm/yy"
                                className="w-full"
                            />
                        )}
                        style={{ maxWidth: "200px" }}
                    ></Column>
                    <Column
                        field="label"
                        dataType="text"
                        header="Opération"
                        sortable
                        filter
                        filterElement={(options: ColumnFilterElementTemplateOptions) => (
                            <InputText
                                value={options.value || ''}
                                onChange={(e) => options.filterApplyCallback(e.target.value)}
                                className="w-full"
                            />
                        )}
                        // TODO: Opérateurs customs less than, greater than, between
                        body={(data: AccountLine) => {
                            return (
                                <div>
                                    {
                                        data.source === "system" && <>
                                            <Tooltip target=".custom-icon-is-system" />
                                            <i
                                                className="pi pi-small pi-cog text-xs text-gray-500 mr-1 custom-icon-is-system"
                                                data-pr-tooltip="Générée automatiquement par le système"
                                            />
                                        </>

                                    }
                                    {
                                        data.transferGroupId && <>
                                            <Tooltip target=".custom-icon-is-transfer" />
                                            <i
                                                className="pi pi-small pi-arrows-h text-xs text-blue-400 mr-1 custom-icon-is-transfer"
                                                data-pr-tooltip={data.targetAccount ? `Lié à ${data.targetAccount.label}` : "Virement"}
                                            />
                                        </>
                                    }
                                    {data.label}
                                </div>
                            )
                        }}
                    ></Column>
                    <Column
                        field="nature.id"
                        header="Nature"
                        body={(data: AccountLine) => data && data.nature ? <ColoredLabel data={data.nature} /> : null}
                        sortable
                        filter
                        showFilterMenu={false}
                        filterElement={(options: ColumnFilterElementTemplateOptions) => (
                            <AccountLineNatureDropdown
                                value={options.value}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                showClear
                                showNullOption
                            />
                        )}
                    ></Column>
                    <Column
                        field="poste.id"
                        header="Poste"
                        body={(data: AccountLine) => data && data.poste ? <ColoredLabel data={data.poste} /> : null}
                        sortable
                        filter
                        // TODO: Opérateurs customs less than, greater than, between
                        showFilterMenu={false}
                        filterElement={(options: ColumnFilterElementTemplateOptions) => (
                            <AccountLinePosteDropdown
                                accountId={accountId}
                                value={options.value}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                showClear
                                showNullOption
                            />
                        )}
                    />
                    <Column
                        field="amount"
                        dataType="numeric"
                        header="Montant"
                        sortable
                        body={(data: AccountLine) => toMonetaryAmount(data.total)}
                        filter
                        filterElement={(options) => (
                            <InputNumber
                                value={options.value || null}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                className="w-full"
                            />
                        )}
                        style={{ maxWidth: "200px" }}
                    />
                    <Column
                        field="isChecked"
                        header="Verif"
                        dataType="boolean"
                        sortable
                        filter
                        filterElement={checkedRowFilterTemplate}
                        body={(data) => <BooleanIcon value={data.isChecked} />}
                    />
                    <Column
                        header="Actions"
                        body={(data: AccountLine) => {
                            return <AccountBookActionsBody
                                data={data}
                                // TODO: Faire quelque chose de plus propre que de recharger toute la table après une suppression ou un duplicata.
                                onDelete={() => loadAccountLines()}
                                onDuplicate={() => loadAccountLines()}
                            />
                        }}
                    />
                </DataTable>
            </Card>
        </PageTemplate>
    )
}

