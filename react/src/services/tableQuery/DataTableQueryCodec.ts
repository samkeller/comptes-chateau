import { SortOrder } from "primereact/api";
import {
    DataTableFilterMeta,
    DataTableFilterMetaData,
    DataTableOperatorFilterMetaData
} from "primereact/datatable";
import { formatApiDate } from "../ApiDateCodec";

export interface TablePagination {
    first: number;
    rows: number;
    page: number;
    skip: number;
    take: number;
}

export interface TableSort {
    field: string;
    direction: "ASC" | "DESC";
}

export interface TableFilterConstraint {
    matchMode: string;
    value: unknown;
}

export interface TableSimpleFilter {
    type: "simple";
    field: string;
    matchMode: string;
    value: unknown;
}

export interface TableOperatorFilter {
    type: "operator";
    field: string;
    operator: "and" | "or";
    constraints: TableFilterConstraint[];
}

export type TableFilter = TableSimpleFilter | TableOperatorFilter;

export interface TableQuery {
    pagination: TablePagination;
    sort: TableSort | null;
    filters: TableFilter[];
}

export interface DataTableLazyState {
    first: number;
    rows: number;
    page: number;
    sortField?: string;
    sortOrder: SortOrder;
    filters: DataTableFilterMeta;
}

/**
 * Convertit un état DataTable PrimeReact en contrat de query API generique.
 */
export default class DataTableQueryCodec {
    static toQuery(lazyState: DataTableLazyState): TableQuery {
        return {
            pagination: this.toPagination(lazyState),
            sort: this.toSort(lazyState),
            filters: this.toFilters(lazyState.filters)
        };
    }

    /**
     * Extrait la pagination de l'état DataTable.
     */
    static toPagination(lazyState: DataTableLazyState): TablePagination {
        return {
            first: lazyState.first,
            rows: lazyState.rows,
            page: lazyState.page,
            skip: lazyState.first,
            take: lazyState.rows
        };
    }

    /**
     * Extrait le tri de l'état DataTable.
     */
    static toSort(lazyState: DataTableLazyState): TableSort | null {
        if (!lazyState.sortField) {
            return null;
        }

        return {
            field: lazyState.sortField,
            direction: lazyState.sortOrder === -1 ? "DESC" : "ASC"
        };
    }

    /**
     * Convertit DataTableFilterMeta en contrat de filtres generic.
     */
    static toFilters(filtersMeta: DataTableFilterMeta): TableFilter[] {
        const filters: TableFilter[] = [];

        Object.entries(filtersMeta).forEach(([field, rawMeta]) => {
            if (!rawMeta) {
                return;
            }

            if (this.isOperatorMeta(rawMeta)) {
                const constraints = rawMeta.constraints.reduce<TableFilterConstraint[]>((acc, constraint) => {
                    const normalizedValue = this.normalizeValue(constraint.value);

                    if (this.isEmptyValue(normalizedValue)) {
                        return acc;
                    }

                    acc.push({
                        matchMode: constraint.matchMode ?? "equals",
                        value: normalizedValue
                    });

                    return acc;
                }, []);

                if (constraints.length === 0) {
                    return;
                }

                filters.push({
                    type: "operator",
                    field,
                    operator: rawMeta.operator === "or" ? "or" : "and",
                    constraints
                });
                return;
            }

            const normalizedValue = this.normalizeValue(rawMeta.value);
            if (this.isEmptyValue(normalizedValue)) {
                return;
            }

            filters.push({
                type: "simple",
                field,
                matchMode: rawMeta.matchMode ?? "equals",
                value: normalizedValue
            });
        });

        return filters;
    }

    /**
     * Encode le contrat de query en req.query HTTP.
     */
    static toQueryParams(lazyState: DataTableLazyState): URLSearchParams {
        const query = this.toQuery(lazyState);
        const params = new URLSearchParams();

        params.append("skip", String(query.pagination.skip));
        params.append("take", String(query.pagination.take));

        if (query.sort) {
            params.append("sortField", query.sort.field);
            params.append("sortOrder", query.sort.direction);
        }

        if (query.filters.length > 0) {
            params.append("filters", JSON.stringify(query.filters));
        }

        return params;
    }

    private static normalizeValue(value: unknown): unknown {
        if (value instanceof Date) {
            return formatApiDate(value);
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.normalizeValue(item));
        }

        return value;
    }

    private static isEmptyValue(value: unknown): boolean {
        if (value === null || value === undefined) {
            return true;
        }

        if (typeof value === "string") {
            return value.trim() === "";
        }

        if (Array.isArray(value)) {
            return value.length === 0 || value.every((item) => this.isEmptyValue(item));
        }

        return false;
    }

    private static isOperatorMeta(
        meta: DataTableFilterMetaData | DataTableOperatorFilterMetaData
    ): meta is DataTableOperatorFilterMetaData {
        return "constraints" in meta;
    }
}
