import { useEffect, useMemo, useState } from "react"
import AccountLine from "../../interfaces/AccountLine"
import { DataTable, DataTablePageEvent } from "primereact/datatable"
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column"
import { Card } from "primereact/card"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Calendar } from "primereact/calendar"
import { Dropdown } from "primereact/dropdown"
import AddAccountLineDialog from "./AddAccountLineDialog"
import { PageTemplate } from "../PageTemplate"
import { ColoredLabel } from "../../components/datatableBodys/ColoredLabel"
import AccountingService from "../../services/AccountingService"
import { FilterMatchMode, SortOrder } from "primereact/api"
import { AccountLineNature } from "../../interfaces/AccountLineNature"
import { AccountLinePoste } from "../../interfaces/AccountLinePoste"
import { ToggleButton, ToggleButtonChangeEvent } from "primereact/togglebutton"
import { InputSwitch } from "primereact/inputswitch"
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Tooltip } from "primereact/tooltip"
import { toMonetaryAmount } from "../../utils/NumberUtils"
import { InputNumber } from "primereact/inputnumber"
import { DataTableLazyState } from "../../services/tableQuery/DataTableQueryCodec"
import { BooleanIcon } from "../../components/datatableBodys/BooleanIcon"
import AccountLinePosteService from "../../services/AccountLinePosteService"
import AccountLineNatureService from "../../services/AccountLineNatureService"
import TooltipInfoIcon from "../../components/TooltipInfoIcon"

type RelationFilterOption = {
    id: number | "null";
    label: string;
    color?: string;
    isNullOption?: boolean;
}

export default function AccountBook() {
    const [accountLines, setAccountLines] = useState<AccountLine[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [totalRecords, setTotalRecords] = useState<number>(0)

    const [showAddDialog, setShowAddDialog] = useState<boolean>(false)

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
            'nature.label': { value: null, matchMode: FilterMatchMode.EQUALS },
            'poste.label': { value: null, matchMode: FilterMatchMode.EQUALS },
            amount: { value: "", matchMode: FilterMatchMode.EQUALS },
            isChecked: { value: null, matchMode: FilterMatchMode.EQUALS }
        }
    });

    // Ligne actuellement modifiée (dialog).
    const [editingLine, setEditingLine] = useState<AccountLine | null>(null)

    // Données annexes
    const [natures, setNatures] = useState<AccountLineNature[]>([])
    const [postes, setPostes] = useState<AccountLinePoste[]>([])

    const natureFilterOptions: RelationFilterOption[] = [
        { id: "null", label: "- Vide -", isNullOption: true },
        ...natures
    ]

    const posteFilterOptions: RelationFilterOption[] = [
        { id: "null", label: "- Vide -", isNullOption: true },
        ...postes
    ]
    useEffect(() => {
        // Load natures and postes
        const natureService = new AccountLineNatureService()
        const posteService = new AccountLinePosteService()
        Promise.all([natureService.getAllNatures(), posteService.getAllPostes()]).then(([n, p]) => {
            setNatures(n)
            setPostes(p)
        })
    }, [])

    useEffect(() => {
        loadAccountLines();
    }, [lazyState]);

    const loadAccountLines = async () => {
        setLoading(true)
        try {
            const service = new AccountingService()
            const lines = await service.getAccountingLinesLazy(lazyState)
            setAccountLines(lines.data)
            setTotalRecords(lines.totalRecords)
        } finally {
            setLoading(false)
        }
    }

    const checkedRowFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return <TriStateCheckbox value={options.value} onChange={(e) => options.filterApplyCallback(e.value)} />;
    };

    const actionsBody = (data: AccountLine) => {
        if (!data) return null
        return (
            <div className="flex">

                <Button
                    rounded text icon="pi pi-pencil" className="p-1"
                    tooltip="Modifier"
                    onClick={() => {
                        setEditingLine(data)
                        setShowAddDialog(true)
                    }}
                ></Button>
                <Button
                    rounded text icon="pi pi-trash" severity="danger" className="p-1"
                    disabled
                // TODO DELETION
                ></Button>
            </div>
        )
    }

    return (
        <PageTemplate pageTitle="Comptes">
            {
                showAddDialog && <AddAccountLineDialog
                    editingLine={editingLine}
                    hideDialog={() => {
                        setEditingLine(null)
                        setShowAddDialog(false)
                    }}
                    refresh={loadAccountLines}
                />
            }
            <div className="flex justify-content-end mb-3">
                <div className="flex flex-column gap-2">
                    <Button label="Ajouter une dépense" icon="pi pi-plus" onClick={() => setShowAddDialog(true)} />
                </div>
            </div>

            <Card>
                <DataTable<Array<AccountLine>>
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
                        filterElement={(options) => (
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
                                    {data.label}
                                </div>
                            )
                        }}
                    ></Column>
                    <Column
                        field="nature.label"
                        header="Nature"
                        body={(data: AccountLine) => data && data.nature ? <ColoredLabel data={data.nature} /> : null}
                        sortable
                        filter
                        showFilterMenu={false}
                        filterElement={(options) => (
                            <Dropdown
                                value={options.value}
                                options={natureFilterOptions}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                optionLabel="label"
                                optionValue="id"
                                showClear
                                itemTemplate={(option: RelationFilterOption) =>
                                    option ?
                                        option.isNullOption ?
                                            <span>{option.label}</span> :
                                            <ColoredLabel data={option as AccountLineNature} />
                                        : null
                                }
                            />
                        )}
                    ></Column>
                    <Column
                        field="poste.label"
                        header="Poste"
                        body={(data: AccountLine) => data && data.poste ? <ColoredLabel data={data.poste} /> : null}
                        sortable
                        filter
                        // TODO: Opérateurs customs less than, greater than, between
                        showFilterMenu={false}
                        filterElement={(options) => (
                            <Dropdown
                                value={options.value}
                                options={posteFilterOptions}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                optionLabel="label"
                                optionValue="id"
                                showClear
                                itemTemplate={(option: RelationFilterOption) =>
                                    option ?
                                        option.isNullOption ?
                                            <span>{option.label}</span> :
                                            <ColoredLabel data={option as AccountLinePoste} />
                                        : null
                                }
                            />
                        )}
                    ></Column>
                    <Column
                        field="amount"
                        dataType="numeric"
                        header="Montant"
                        sortable
                        body={(data: AccountLine) => toMonetaryAmount(data.total)}
                        filter
                        filterElement={(options) => (
                            <InputNumber
                                value={options.value || ''}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                className="w-full"
                            />
                        )}
                        style={{ maxWidth: "200px" }}
                    ></Column>
                    <Column
                        field="isChecked"
                        header="Verif"
                        dataType="boolean"
                        sortable
                        filter
                        filterElement={checkedRowFilterTemplate}
                        body={(data) => <BooleanIcon value={data.isChecked} />}></Column>
                    <Column
                        header="Actions"
                        body={actionsBody}
                    />
                </DataTable>
            </Card>
        </PageTemplate>
    )
}

