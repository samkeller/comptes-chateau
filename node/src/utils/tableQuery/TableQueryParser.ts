import { ParsedQs } from "qs";
import {
    TableQueryFiltersSchema,
    type TableQuery,
    type TableQueryFilter,
    type TableQueryPagination,
    type TableQuerySort,
} from "@chocosous/shared";
import { badRequest } from "../AppError";

export interface TableQueryParserOptions {
    allowedSortFields: Set<string>;
    allowedFilterFields: Set<string>;
    pagination?: false;
    defaultTake?: number;
    maxTake?: number;
}

/**
 * Parse et valide un contrat de query tabulaire générique passé en req.query.
 */
export default class TableQueryParser {
    static parse(query: ParsedQs, options: TableQueryParserOptions & { pagination: false }): Omit<TableQuery, "pagination">;
    static parse(query: ParsedQs, options: TableQueryParserOptions): TableQuery & { pagination: TableQueryPagination };
    static parse(
        query: ParsedQs,
        options: TableQueryParserOptions
    ): TableQuery | Omit<TableQuery, "pagination"> {
        const pagination = options.pagination === false ? undefined : this.parsePagination(query, options);
        const sort = this.parseSort(query, options.allowedSortFields);
        const filters = this.parseFilters(query, options.allowedFilterFields);

        return {
            ...(pagination ? { pagination } : {}),
            sort,
            filters
        };
    }

    private static parsePagination(query: ParsedQs, options: TableQueryParserOptions): TableQueryPagination {
        const defaultTake = options.defaultTake ?? 100;
        const maxTake = options.maxTake ?? 200;

        const skip = this.parseInteger(query.skip, "skip", 0);
        const take = this.parseInteger(query.take, "take", defaultTake);

        if (skip < 0) {
            throw badRequest("QUERY_VALIDATION", "Query parameter 'skip' must be >= 0.");
        }

        if (take <= 0 || take > maxTake) {
            throw badRequest("QUERY_VALIDATION", `Query parameter 'take' must be between 1 and ${maxTake}.`);
        }

        return {
            skip,
            take
        };
    }

    private static parseSort(query: ParsedQs, allowedSortFields: Set<string>): TableQuerySort | null {
        const sortField = this.getSingleString(query.sortField);
        if (!sortField) {
            return null;
        }

        if (!allowedSortFields.has(sortField)) {
            throw badRequest("QUERY_VALIDATION", `Sort field '${sortField}' is not allowed.`);
        }

        const sortOrder = this.getSingleString(query.sortOrder);
        const direction: TableQuerySort["direction"] = sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";

        return {
            field: sortField,
            direction
        };
    }

    private static parseFilters(query: ParsedQs, allowedFilterFields: Set<string>): TableQueryFilter[] {
        const filtersRaw = this.getSingleString(query.filters);
        if (!filtersRaw) {
            return [];
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(filtersRaw);
        } catch {
            throw badRequest("QUERY_VALIDATION", "Query parameter 'filters' must be valid JSON.");
        }

        if (!Array.isArray(parsed)) {
            throw badRequest("QUERY_VALIDATION", "Query parameter 'filters' must be an array.");
        }

        const result = TableQueryFiltersSchema.safeParse(parsed);
        if (!result.success) {
            throw badRequest("QUERY_VALIDATION", "Query parameter 'filters' contains an invalid filter.");
        }

        return result.data.map((filter, index) => {
            if (!allowedFilterFields.has(filter.field)) {
                throw badRequest("QUERY_VALIDATION", `Filter at index ${index} has disallowed field '${filter.field}'.`);
            }
            return filter;
        });
    }

    private static parseInteger(rawValue: ParsedQs[string], fieldName: string, fallback: number): number {
        const raw = this.getSingleString(rawValue);
        if (raw === undefined) {
            return fallback;
        }

        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            throw badRequest("QUERY_VALIDATION", `Query parameter '${fieldName}' must be an integer.`);
        }

        return parsed;
    }

    private static getSingleString(rawValue: ParsedQs[string]): string | undefined {
        if (rawValue === undefined) {
            return undefined;
        }

        if (Array.isArray(rawValue)) {
            if (rawValue.length === 0) {
                return undefined;
            }
            return String(rawValue[0]);
        }

        return String(rawValue);
    }
}
