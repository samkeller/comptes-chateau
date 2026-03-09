import { ParsedQs } from "qs";

export type TableSortDirection = "ASC" | "DESC";

export interface ParsedTableQueryPagination {
    skip: number;
    take: number;
}

export interface ParsedTableQuerySort {
    field: string;
    direction: TableSortDirection;
}

export interface ParsedTableFilterConstraint {
    matchMode: string;
    value: unknown;
}

export interface ParsedTableSimpleFilter {
    type: "simple";
    field: string;
    matchMode: string;
    value: unknown;
}

export interface ParsedTableOperatorFilter {
    type: "operator";
    field: string;
    operator: "and" | "or";
    constraints: ParsedTableFilterConstraint[];
}

export type ParsedTableFilter = ParsedTableSimpleFilter | ParsedTableOperatorFilter;

export interface ParsedTableQuery {
    pagination: ParsedTableQueryPagination;
    sort: ParsedTableQuerySort | null;
    filters: ParsedTableFilter[];
}

export interface TableQueryParserOptions {
    allowedSortFields: Set<string>;
    allowedFilterFields: Set<string>;
    defaultTake?: number;
    maxTake?: number;
}

export class TableQueryValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TableQueryValidationError";
    }
}

/**
 * Parse et valide un contrat de query tabulaire générique passé en req.query.
 */
export default class TableQueryParser {
    static parse(query: ParsedQs, options: TableQueryParserOptions): ParsedTableQuery {
        const defaultTake = options.defaultTake ?? 100;
        const maxTake = options.maxTake ?? 200;

        const skip = this.parseInteger(query.skip, "skip", 0);
        const take = this.parseInteger(query.take, "take", defaultTake);

        if (skip < 0) {
            throw new TableQueryValidationError("Query parameter 'skip' must be >= 0.");
        }

        if (take <= 0 || take > maxTake) {
            throw new TableQueryValidationError(`Query parameter 'take' must be between 1 and ${maxTake}.`);
        }

        const sort = this.parseSort(query, options.allowedSortFields);
        const filters = this.parseFilters(query, options.allowedFilterFields);

        return {
            pagination: { skip, take },
            sort,
            filters
        };
    }

    private static parseSort(query: ParsedQs, allowedSortFields: Set<string>): ParsedTableQuerySort | null {
        const sortField = this.getSingleString(query.sortField);
        if (!sortField) {
            return null;
        }

        if (!allowedSortFields.has(sortField)) {
            throw new TableQueryValidationError(`Sort field '${sortField}' is not allowed.`);
        }

        const sortOrder = this.getSingleString(query.sortOrder);
        const direction: TableSortDirection = sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";

        return {
            field: sortField,
            direction
        };
    }

    private static parseFilters(query: ParsedQs, allowedFilterFields: Set<string>): ParsedTableFilter[] {
        const filtersRaw = this.getSingleString(query.filters);
        if (!filtersRaw) {
            return [];
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(filtersRaw);
        } catch {
            throw new TableQueryValidationError("Query parameter 'filters' must be valid JSON.");
        }

        if (!Array.isArray(parsed)) {
            throw new TableQueryValidationError("Query parameter 'filters' must be an array.");
        }

        return parsed.map((item, index) => this.parseFilterItem(item, index, allowedFilterFields));
    }

    private static parseFilterItem(item: unknown, index: number, allowedFilterFields: Set<string>): ParsedTableFilter {
        if (!item || typeof item !== "object") {
            throw new TableQueryValidationError(`Filter at index ${index} is invalid.`);
        }

        const record = item as Record<string, unknown>;
        const type = record.type;
        const field = record.field;

        if (typeof type !== "string" || (type !== "simple" && type !== "operator")) {
            throw new TableQueryValidationError(`Filter at index ${index} has invalid type.`);
        }

        if (typeof field !== "string" || !allowedFilterFields.has(field)) {
            throw new TableQueryValidationError(`Filter at index ${index} has disallowed field '${String(field)}'.`);
        }

        if (type === "simple") {
            const matchMode = record.matchMode;
            if (typeof matchMode !== "string") {
                throw new TableQueryValidationError(`Filter at index ${index} has invalid matchMode.`);
            }

            return {
                type,
                field,
                matchMode,
                value: record.value
            };
        }

        const operator = record.operator;
        if (operator !== "and" && operator !== "or") {
            throw new TableQueryValidationError(`Filter at index ${index} has invalid operator.`);
        }

        const constraints = record.constraints;
        if (!Array.isArray(constraints)) {
            throw new TableQueryValidationError(`Filter at index ${index} has invalid constraints.`);
        }

        const parsedConstraints = constraints.map((constraint, constraintIndex) => {
            if (!constraint || typeof constraint !== "object") {
                throw new TableQueryValidationError(
                    `Filter at index ${index}, constraint ${constraintIndex} is invalid.`
                );
            }

            const constraintRecord = constraint as Record<string, unknown>;
            const matchMode = constraintRecord.matchMode;
            if (typeof matchMode !== "string") {
                throw new TableQueryValidationError(
                    `Filter at index ${index}, constraint ${constraintIndex} has invalid matchMode.`
                );
            }

            return {
                matchMode,
                value: constraintRecord.value
            };
        });

        return {
            type,
            field,
            operator,
            constraints: parsedConstraints
        };
    }

    private static parseInteger(rawValue: ParsedQs[string], fieldName: string, fallback: number): number {
        const raw = this.getSingleString(rawValue);
        if (raw === undefined) {
            return fallback;
        }

        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            throw new TableQueryValidationError(`Query parameter '${fieldName}' must be an integer.`);
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
