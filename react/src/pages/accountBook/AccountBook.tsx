import { useEffect, useState } from "react"
import AccountLine from "../../interfaces/AccountLine"
import { DataTable, DataTableFilterMetaData } from "primereact/datatable"
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

export interface LazyTableState {
    first: number;
    rows: number;
    page: number;
    sortField?: string;
    sortOrder: SortOrder;
    filters: { [key: string]: DataTableFilterMetaData };
}

export default function AccountBook() {
    const [accountLines, setAccountLines] = useState<AccountLine[]>([])

    const [showAddDialog, setShowAddDialog] = useState<boolean>(false)

    const [lazyState, setLazyState] = useState<LazyTableState>({
        first: 0,
        rows: 10,
        page: 1,
        sortField: 'dateOperation',
        sortOrder: -1, // DESC
        filters: {
            dateValeur: { value: null, matchMode: FilterMatchMode.DATE_IS },
            dateOperation: { value: null, matchMode: FilterMatchMode.DATE_IS },
            operation: { value: "", matchMode: FilterMatchMode.CONTAINS },
            'nature.label': { value: null, matchMode: FilterMatchMode.EQUALS },
            'poste.label': { value: null, matchMode: FilterMatchMode.EQUALS },
            isHorsCB: { value: null, matchMode: FilterMatchMode.EQUALS },
            isChecked: { value: null, matchMode: FilterMatchMode.EQUALS }
        }
    });

    // Ligne actuellement modifiée (dialog).
    const [editingLine, setEditingLine] = useState<AccountLine | null>(null)

    // Données annexes
    const [natures, setNatures] = useState<AccountLineNature[]>([])
    const [postes, setPostes] = useState<AccountLinePoste[]>([])

    // Mode d'édition
    const [isEditMode, setIsEditMode] = useState<boolean>(false)

    useEffect(() => {
        // Load natures and postes
        const service = new AccountingService()
        Promise.all([service.getAllNatures(), service.getAllPostes()]).then(([n, p]) => {
            setNatures(n)
            setPostes(p)
        })
        // Load account lines
        loadAccountLines()
    }, [])

    useEffect(() => {
        loadAccountLines();
    }, [lazyState]);

    const loadAccountLines = async () => {
        const service = new AccountingService()
        const lines = await service.getAccountingLinesLazy(lazyState)
        setAccountLines(lines.data)
    }

    const updateLine = async (lineToUpdate: AccountLine) => {
        await new AccountingService().saveAccountingLine(lineToUpdate);
        loadAccountLines();
    };


    const isHorsCBBody = (bool: boolean) => {
        return bool ?
            <i className="pi pi-check text-green-500"></i> :
            <i className="pi pi-times text-red-500"></i>
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
        <PageTemplate pageTitle="Index">
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
                    <div className="p-component flex justify-content-end align-items-center gap-2">
                        <span>Mode d'édition</span>
                        <InputSwitch checked={isEditMode} onChange={(e) => setIsEditMode(e.value)} />
                    </div>
                </div>
            </div>

            <Card>
                <DataTable<Array<AccountLine>>
                    value={accountLines}
                    onSort={e => setLazyState(prev => ({ ...prev, sortField: e.sortField, sortOrder: e.sortOrder as SortOrder }))}
                    removableSort
                    sortField={lazyState.sortField}
                    sortOrder={lazyState.sortOrder}
                    // Filtres & tris
                    lazy
                    filterDisplay="row"
                    filters={lazyState.filters}
                    onFilter={e => setLazyState(prev => ({ ...prev, filters: e.filters as LazyTableState['filters'] }))}

                    // Style
                    size="small"
                >
                    <Column
                        field="dateOperation"
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
                        dataType="date"
                    ></Column>
                    <Column
                        field="dateValeur"
                        header="Date valeur"
                        body={(v: AccountLine) => v ? v.displayDateValeur : null}
                        filter
                        filterElement={(options) => (
                            <Calendar
                                value={options.value}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                dateFormat="dd/mm/yy"
                                className="w-full"
                            />
                        )}
                        // TODO: Opérateurs customs less than, greater than, between
                        dataType="date"
                    ></Column>
                    <Column
                        field="operation"
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
                        showFilterMenu={false}
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
                                options={natures}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                optionLabel="label"
                                optionValue="id"
                                itemTemplate={(option) => option ? <ColoredLabel data={option} /> : null}
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
                                options={postes}
                                onChange={(e) => options.filterApplyCallback(e.value)}
                                optionLabel="label"
                                optionValue="id"
                                itemTemplate={(option) => option ? <ColoredLabel data={option} /> : null}
                            />
                        )}
                    ></Column>
                    <Column
                        field="solde"
                        header="Solde"
                        sortable
                        body={(data: AccountLine) => data ?
                            new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.solde) :
                            null
                        }
                    ></Column>
                    <Column
                        field="isHorsCB"
                        header="Est hors CB"
                        dataType="boolean"
                        sortable
                        filter
                        filterElement={checkedRowFilterTemplate}
                        body={d => isHorsCBBody(d.isHorsCB)}
                    ></Column>
                    <Column
                        field="isChecked"
                        header="Verif"
                        dataType="boolean"
                        sortable
                        filter
                        filterElement={checkedRowFilterTemplate}
                        body={(data) => {
                            return isEditMode ?
                                <ToggleButton
                                    onIcon="pi pi-check" offIcon="pi pi-times"
                                    onLabel="Vérifié" offLabel="Non vérifié"
                                    checked={data.isChecked}
                                    onChange={(e: ToggleButtonChangeEvent) => updateLine({
                                        ...data,
                                        isChecked: e.value
                                    })}
                                /> :
                                isHorsCBBody(data.isChecked)
                        }} ></Column>
                    <Column
                        header="Actions"
                        body={actionsBody}
                    />
                </DataTable>
            </Card>
        </PageTemplate>
    )
}

