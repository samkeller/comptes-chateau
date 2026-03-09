import { Brackets, ObjectLiteral, SelectQueryBuilder, WhereExpressionBuilder } from "typeorm";
import {
    ParsedTableFilterConstraint,
    ParsedTableFilter,
    ParsedTableOperatorFilter,
    ParsedTableQuerySort,
    ParsedTableSimpleFilter
} from "./parsers/TableQueryParser";

export interface TableSortHandler<TEntity extends ObjectLiteral> {
    apply(qb: SelectQueryBuilder<TEntity>, direction: "ASC" | "DESC"): void;
}

export interface TableFilterHandler<TEntity extends ObjectLiteral> {
    applySimple?(qb: SelectQueryBuilder<TEntity>, filter: ParsedTableSimpleFilter): void;
    applyOperator?(qb: SelectQueryBuilder<TEntity>, filter: ParsedTableOperatorFilter): void;
}

export interface TableQueryMapperConfig<TEntity extends ObjectLiteral> {
    defaultSort: { field: string; direction: "ASC" | "DESC" };
    sortHandlers: Record<string, TableSortHandler<TEntity>>;
    filterHandlers: Record<string, TableFilterHandler<TEntity>>;
}

/**
 * Construit un handler de tri standard avec tie-breaker optionnel.
 */
export function createOrderBySortHandler<TEntity extends ObjectLiteral>(
    orderBySql: string,
    tieBreakerSql?: string
): TableSortHandler<TEntity> {
    return {
        apply: (qb, direction) => {
            qb.orderBy(orderBySql, direction);
            if (tieBreakerSql) {
                qb.addOrderBy(tieBreakerSql, direction);
            }
        }
    };
}

/**
 * Construit un handler de tri sur expression SQL calculée via alias de sélection.
 */
export function createComputedSortHandler<TEntity extends ObjectLiteral>(
    expressionSql: string,
    selectAlias: string,
    tieBreakerSql?: string
): TableSortHandler<TEntity> {
    return {
        apply: (qb, direction) => {
            qb.addSelect(expressionSql, selectAlias);
            qb.orderBy(selectAlias, direction);
            if (tieBreakerSql) {
                qb.addOrderBy(tieBreakerSql, direction);
            }
        }
    };
}

/**
 * Construit un handler de filtre date avec conversion explicite.
 */
export function createDateSimpleFilterHandler<TEntity extends ObjectLiteral>(
    fieldSql: string,
    parseDate: (raw: string) => Date,
    paramName: string
): TableFilterHandler<TEntity> {
    const applyDateConstraint = (
        qb: WhereExpressionBuilder,
        constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter,
        suffix: string,
        useOr: boolean
    ): void => {
        const append = (sql: string, params: Record<string, unknown>): void => {
            if (useOr) {
                qb.orWhere(sql, params);
                return;
            }
            qb.andWhere(sql, params);
        };

        if (constraint.matchMode === "between") {
            if (!Array.isArray(constraint.value) || constraint.value.length !== 2) {
                return;
            }

            const [fromRaw, toRaw] = constraint.value;
            if (fromRaw === null || fromRaw === undefined || toRaw === null || toRaw === undefined) {
                return;
            }

            const fromDate = parseDate(String(fromRaw));
            const toDate = parseDate(String(toRaw));
            append(
                `${fieldSql} BETWEEN :${paramName}From${suffix} AND :${paramName}To${suffix}`,
                {
                    [`${paramName}From${suffix}`]: fromDate,
                    [`${paramName}To${suffix}`]: toDate
                }
            );
            return;
        }

        const parsedDate = parseDate(String(constraint.value));

        switch (constraint.matchMode) {
            case "dateBefore":
            case "lt":
                append(`${fieldSql} < :${paramName}${suffix}`, { [`${paramName}${suffix}`]: parsedDate });
                return;
            case "dateAfter":
            case "gt":
                append(`${fieldSql} > :${paramName}${suffix}`, { [`${paramName}${suffix}`]: parsedDate });
                return;
            case "lte":
                append(`${fieldSql} <= :${paramName}${suffix}`, { [`${paramName}${suffix}`]: parsedDate });
                return;
            case "gte":
                append(`${fieldSql} >= :${paramName}${suffix}`, { [`${paramName}${suffix}`]: parsedDate });
                return;
            case "dateIsNot":
            case "notEquals":
                append(`${fieldSql} <> :${paramName}${suffix}`, { [`${paramName}${suffix}`]: parsedDate });
                return;
            case "dateIs":
            case "equals":
            default:
                append(`${fieldSql} = :${paramName}${suffix}`, { [`${paramName}${suffix}`]: parsedDate });
        }
    };

    return {
        applySimple: (qb, filter) => {
            applyDateConstraint(qb, filter, "Simple", false);
        },
        applyOperator: (qb, filter) => {
            const useOr = filter.operator === "or";
            qb.andWhere(
                new Brackets((nestedQb) => {
                    filter.constraints.forEach((constraint, index) => {
                        applyDateConstraint(nestedQb, constraint, String(index), useOr);
                    });
                })
            );
        }
    };
}

/**
 * Construit un handler texte (equals ou contains/ILIKE).
 */
export function createTextSimpleFilterHandler<TEntity extends ObjectLiteral>(
    fieldSql: string,
    paramName: string
): TableFilterHandler<TEntity> {
    const applyTextConstraint = (
        qb: WhereExpressionBuilder,
        constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter,
        suffix: string,
        useOr: boolean
    ): void => {
        const append = (sql: string, params: Record<string, unknown>): void => {
            if (useOr) {
                qb.orWhere(sql, params);
                return;
            }
            qb.andWhere(sql, params);
        };

        if (constraint.matchMode === "in" || constraint.matchMode === "notIn") {
            const values = Array.isArray(constraint.value)
                ? constraint.value.map((value) => String(value)).filter((value) => value.trim().length > 0)
                : [];

            if (values.length === 0) {
                return;
            }

            const operator = constraint.matchMode === "notIn" ? "NOT IN" : "IN";
            append(`${fieldSql} ${operator} (:...${paramName}${suffix})`, {
                [`${paramName}${suffix}`]: values
            });
            return;
        }

        const value = String(constraint.value);
        const escapedValue = value.replace(/[%_]/g, "\\$&");

        switch (constraint.matchMode) {
            case "startsWith":
                append(`${fieldSql} ILIKE :${paramName}${suffix} ESCAPE '\\'`, {
                    [`${paramName}${suffix}`]: `${escapedValue}%`
                });
                return;
            case "notContains":
                append(`${fieldSql} NOT ILIKE :${paramName}${suffix} ESCAPE '\\'`, {
                    [`${paramName}${suffix}`]: `%${escapedValue}%`
                });
                return;
            case "endsWith":
                append(`${fieldSql} ILIKE :${paramName}${suffix} ESCAPE '\\'`, {
                    [`${paramName}${suffix}`]: `%${escapedValue}`
                });
                return;
            case "equals":
                append(`${fieldSql} = :${paramName}${suffix}`, { [`${paramName}${suffix}`]: value });
                return;
            case "notEquals":
                append(`${fieldSql} <> :${paramName}${suffix}`, { [`${paramName}${suffix}`]: value });
                return;
            case "contains":
            default:
                append(`${fieldSql} ILIKE :${paramName}${suffix} ESCAPE '\\'`, {
                    [`${paramName}${suffix}`]: `%${escapedValue}%`
                });
        }
    };

    return {
        applySimple: (qb, filter) => {
            applyTextConstraint(qb, filter, "Simple", false);
        },
        applyOperator: (qb, filter) => {
            const useOr = filter.operator === "or";
            qb.andWhere(
                new Brackets((nestedQb) => {
                    filter.constraints.forEach((constraint, index) => {
                        applyTextConstraint(nestedQb, constraint, String(index), useOr);
                    });
                })
            );
        }
    };
}

/**
 * Construit un handler pour ids numeriques (souvent relations FK).
 */
export function createNumericEqualsSimpleFilterHandler<TEntity extends ObjectLiteral>(
    fieldSql: string,
    paramName: string
): TableFilterHandler<TEntity> {
    const isNullFilterValue = (value: unknown): boolean => {
        if (value === null) {
            return true;
        }

        if (typeof value === "string") {
            return value.trim().toLowerCase() === "null";
        }

        return false;
    };

    const applyNumericEqualsConstraint = (
        qb: WhereExpressionBuilder,
        constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter,
        suffix: string,
        useOr: boolean
    ): void => {
        const append = (sql: string, params: Record<string, unknown>): void => {
            if (useOr) {
                qb.orWhere(sql, params);
                return;
            }
            qb.andWhere(sql, params);
        };

        const appendRaw = (sql: string): void => {
            if (useOr) {
                qb.orWhere(sql);
                return;
            }
            qb.andWhere(sql);
        };

        if (isNullFilterValue(constraint.value)) {
            if (constraint.matchMode === "notEquals") {
                appendRaw(`${fieldSql} IS NOT NULL`);
                return;
            }

            appendRaw(`${fieldSql} IS NULL`);
            return;
        }

        const value = Number(constraint.value);
        if (Number.isNaN(value)) {
            return;
        }

        if (constraint.matchMode === "notEquals") {
            append(`${fieldSql} <> :${paramName}${suffix}`, { [`${paramName}${suffix}`]: value });
            return;
        }

        append(`${fieldSql} = :${paramName}${suffix}`, { [`${paramName}${suffix}`]: value });
    };

    return {
        applySimple: (qb, filter) => {
            applyNumericEqualsConstraint(qb, filter, "Simple", false);
        },
        applyOperator: (qb, filter) => {
            const useOr = filter.operator === "or";
            qb.andWhere(
                new Brackets((nestedQb) => {
                    filter.constraints.forEach((constraint, index) => {
                        applyNumericEqualsConstraint(nestedQb, constraint, String(index), useOr);
                    });
                })
            );
        }
    };
}

/**
 * Construit un handler booleen simple.
 */
export function createBooleanSimpleFilterHandler<TEntity extends ObjectLiteral>(
    fieldSql: string,
    paramName: string
): TableFilterHandler<TEntity> {
    const toBooleanValue = (
        constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter
    ): boolean | null => {
        if (typeof constraint.value === "boolean") {
            return constraint.value;
        }

        if (typeof constraint.value === "string") {
            const normalized = constraint.value.trim().toLowerCase();
            if (normalized === "true") {
                return true;
            }
            if (normalized === "false") {
                return false;
            }
            return null;
        }

        if (typeof constraint.value === "number") {
            if (constraint.value === 1) {
                return true;
            }
            if (constraint.value === 0) {
                return false;
            }
        }

        return null;
    };

    const applyBooleanConstraint = (
        qb: WhereExpressionBuilder,
        constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter,
        suffix: string,
        useOr: boolean
    ): void => {
        const value = toBooleanValue(constraint);
        if (value === null) {
            return;
        }

        const operator = constraint.matchMode === "notEquals" ? "<>" : "=";
        const sql = `${fieldSql} ${operator} :${paramName}${suffix}`;
        const params = { [`${paramName}${suffix}`]: value };

        if (useOr) {
            qb.orWhere(sql, params);
            return;
        }

        qb.andWhere(sql, params);
    };

    return {
        applySimple: (qb, filter) => {
            applyBooleanConstraint(qb, filter, "Simple", false);
        },
        applyOperator: (qb, filter) => {
            const useOr = filter.operator === "or";
            qb.andWhere(
                new Brackets((nestedQb) => {
                    filter.constraints.forEach((constraint, index) => {
                        applyBooleanConstraint(nestedQb, constraint, String(index), useOr);
                    });
                })
            );
        }
    };
}

function toNumericValue(constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter): number | null {
    const numericValue = Number(constraint.value);
    return Number.isNaN(numericValue) ? null : numericValue;
}

function numericSqlOperator(matchMode: string): string {
    switch (matchMode) {
        case "lt":
            return "<";
        case "lte":
            return "<=";
        case "gt":
            return ">";
        case "gte":
            return ">=";
        case "notEquals":
            return "<>";
        case "equals":
        default:
            return "=";
    }
}

function applyNumericConstraint(
    qb: WhereExpressionBuilder,
    fieldSql: string,
    constraint: ParsedTableFilterConstraint | ParsedTableSimpleFilter,
    paramName: string,
    useOr: boolean
): void {
    if (constraint.matchMode === "in" || constraint.matchMode === "notIn") {
        if (!Array.isArray(constraint.value)) {
            return;
        }

        const values = constraint.value.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
        if (values.length === 0) {
            return;
        }

        const sqlOperator = constraint.matchMode === "notIn" ? "NOT IN" : "IN";
        const sql = `${fieldSql} ${sqlOperator} (:...${paramName})`;
        const params = { [paramName]: values };

        if (useOr) {
            qb.orWhere(sql, params);
            return;
        }

        qb.andWhere(sql, params);
        return;
    }

    if (constraint.matchMode === "between") {
        if (!Array.isArray(constraint.value) || constraint.value.length !== 2) {
            return;
        }

        const [minRaw, maxRaw] = constraint.value;
        const minValue = Number(minRaw);
        const maxValue = Number(maxRaw);
        if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
            return;
        }

        const sql = `${fieldSql} BETWEEN :${paramName}Min AND :${paramName}Max`;
        const params = {
            [`${paramName}Min`]: minValue,
            [`${paramName}Max`]: maxValue
        };

        if (useOr) {
            qb.orWhere(sql, params);
            return;
        }

        qb.andWhere(sql, params);
        return;
    }

    const numericValue = toNumericValue(constraint);
    if (numericValue === null) {
        return;
    }

    const sql = `${fieldSql} ${numericSqlOperator(constraint.matchMode)} :${paramName}`;
    const params = { [paramName]: numericValue };

    if (useOr) {
        qb.orWhere(sql, params);
        return;
    }

    qb.andWhere(sql, params);
}

/**
 * Construit un handler numerique qui supporte simple + operator constraints.
 */
export function createNumericComparisonFilterHandler<TEntity extends ObjectLiteral>(
    fieldSql: string,
    paramPrefix: string
): TableFilterHandler<TEntity> {
    return {
        applySimple: (qb, filter) => {
            applyNumericConstraint(qb, fieldSql, filter, `${paramPrefix}Simple`, false);
        },
        applyOperator: (qb, filter) => {
            const useOr = filter.operator === "or";

            qb.andWhere(
                new Brackets((nestedQb) => {
                    filter.constraints.forEach((constraint, index) => {
                        applyNumericConstraint(
                            nestedQb,
                            fieldSql,
                            constraint,
                            `${paramPrefix}${index}`,
                            useOr
                        );
                    });
                })
            );
        }
    };
}

/**
 * Applique des règles de tri/filtre génériques avec handlers par champ.
 */
export default class TableQueryMapper {
    static applySort<TEntity extends ObjectLiteral>(
        qb: SelectQueryBuilder<TEntity>,
        sort: ParsedTableQuerySort | null,
        sortHandlers: TableQueryMapperConfig<TEntity>["sortHandlers"],
        defaultSort: TableQueryMapperConfig<TEntity>["defaultSort"]
    ): void {
        if (!sort) {
            const defaultSortHandler = sortHandlers[defaultSort.field];
            defaultSortHandler.apply(qb, defaultSort.direction);
            return;
        }

        const handler = sortHandlers[sort.field];
        handler.apply(qb, sort.direction);
    }

    static applyFilters<TEntity extends ObjectLiteral>(
        qb: SelectQueryBuilder<TEntity>,
        filters: ParsedTableFilter[],
        filterHandlers: Record<string, TableFilterHandler<TEntity>>
    ): void {
        filters.forEach((filter) => {
            const fieldHandler = filterHandlers[filter.field];
            if (!fieldHandler) {
                return;
            }

            if (filter.type === "simple" && fieldHandler.applySimple) {
                fieldHandler.applySimple(qb, filter);
                return;
            }

            if (filter.type === "operator" && fieldHandler.applyOperator) {
                fieldHandler.applyOperator(qb, filter);
            }
        });
    }
}
