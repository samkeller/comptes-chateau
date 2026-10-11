import { SortOrder } from "primereact/api";
import {
    DataTableFilterMeta,
    DataTableFilterMetaData,
    DataTableOperatorFilterMetaData
} from "primereact/datatable";
import type {
    TableQuery,
    TableQueryFilter,
    TableQueryFilterConstraint,
    TableQueryPagination,
    TableQuerySort,
} from "@chocosous/shared";
import { formatApiDate } from "../../utils/DatesUtils";

export interface DataTableQueryOptions {
    includePagination?: boolean;
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
    /**
     * Construit le contrat API complet (pagination + tri + filtres)
     * a partir du state lazy PrimeReact.
     * @param lazyState L'état lazy du DataTable PrimeReact.
     * @param options Options de construction de la query.
     * @default {includePagination: true}
     * @returns Le contrat API complet.
     */
    static toQuery(lazyState: DataTableLazyState, options: DataTableQueryOptions = {}): TableQuery {
        return {
            ...(options.includePagination === false ? {} : { pagination: this.toPagination(lazyState) }),
            sort: this.toSort(lazyState),
            filters: this.toFilters(lazyState.filters)
        };
    }

    /**
     * Extrait la pagination de l'état DataTable.
     */
    static toPagination(lazyState: DataTableLazyState): TableQueryPagination {
        return {
            skip: lazyState.first,
            take: lazyState.rows
        };
    }

    /**
     * Extrait le tri de l'état DataTable.
     */
    static toSort(lazyState: DataTableLazyState): TableQuerySort | null {
        if (!lazyState.sortField) {
            return null;
        }

        return {
            field: lazyState.sortField,
            direction: lazyState.sortOrder === -1 ? "DESC" : "ASC"
        };
    }

    /**
        * Convertit DataTableFilterMeta en contrat de filtres API.
        *
        * - Les filtres simples deviennent `type: "simple"`.
        * - Les filtres composés deviennent `type: "operator"`.
        * - Les valeurs vides sont ignorees pour eviter des filtres inutiles.
     */
    static toFilters(filtersMeta: DataTableFilterMeta): TableQueryFilter[] {
        const filters: TableQueryFilter[] = [];

        Object.entries(filtersMeta).forEach(([field, rawMeta]) => {
            if (!rawMeta) {
                return;
            }

            if (this.isOperatorMeta(rawMeta)) {
                const constraints = rawMeta.constraints.reduce<TableQueryFilterConstraint[]>((acc, constraint) => {
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
        * Encode le contrat de query en `req.query` HTTP.
        *
        * Format emis:
        * - `skip` / `take`
        * - `sortField` / `sortOrder`
        * - `filters` (JSON stringifie) si present
     */
    static toQueryParams(lazyState: DataTableLazyState, options: DataTableQueryOptions = {}): URLSearchParams {
        const query = this.toQuery(lazyState, options);
        const params = new URLSearchParams();

        if (query.pagination) {
            params.append("skip", String(query.pagination.skip));
            params.append("take", String(query.pagination.take));
        }

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
