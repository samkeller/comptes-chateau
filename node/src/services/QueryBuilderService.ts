import { SelectQueryBuilder } from "typeorm";
import { AccountingLine } from "../entities/AccountingLine";

export interface FilterCondition {
    field: string;
    operator: 'eq' | 'gte' | 'lte' | 'gt' | 'lt' | 'like' | 'in' | 'isNull';
    value?: any;
}

export interface SortCondition {
    field: string;
    direction: 'ASC' | 'DESC';
}

export interface PaginationOptions {
    skip: number;
    take: number;
}

export class QueryBuilderService {
    static applyFilters(
        qb: SelectQueryBuilder<AccountingLine>,
        filters: FilterCondition[]
    ): SelectQueryBuilder<AccountingLine> {
        filters.forEach((filter, index) => {
            const paramName = `param${index}`;

            switch (filter.operator) {
                case 'eq':
                    if (filter.field.includes('.')) {
                        const [relation, field] = filter.field.split('.');
                        qb.andWhere(`${relation}.${field} = :${paramName}`, { [paramName]: filter.value });
                    } else {
                        qb.andWhere(`al.${filter.field} = :${paramName}`, { [paramName]: filter.value });
                    }
                    break;

                case 'like':
                    qb.andWhere(`al.${filter.field} ILIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
                    break;

                case 'gte':
                    qb.andWhere(`al.${filter.field} >= :${paramName}`, { [paramName]: filter.value });
                    break;

                case 'lte':
                    qb.andWhere(`al.${filter.field} <= :${paramName}`, { [paramName]: filter.value });
                    break;

                case 'gt':
                    qb.andWhere(`al.${filter.field} > :${paramName}`, { [paramName]: filter.value });
                    break;

                case 'lt':
                    qb.andWhere(`al.${filter.field} < :${paramName}`, { [paramName]: filter.value });
                    break;

                case 'in':
                    qb.andWhere(`al.${filter.field} IN (:...${paramName})`, { [paramName]: filter.value });
                    break;

                case 'isNull':
                    if (filter.value) {
                        qb.andWhere(`al.${filter.field} IS NULL`);
                    } else {
                        qb.andWhere(`al.${filter.field} IS NOT NULL`);
                    }
                    break;
            }
        });

        return qb;
    }

    static applySort(
        qb: SelectQueryBuilder<AccountingLine>,
        sort: SortCondition | null
    ): SelectQueryBuilder<AccountingLine> {
        if (!sort) {
            return qb;
        }

        if (sort.field.includes('.')) {
            const [relation, field] = sort.field.split('.');
            qb.orderBy(`${relation}.${field}`, sort.direction);
        } else {
            qb.orderBy(`al.${sort.field}`, sort.direction);
        }

        return qb;
    }

    static applyPagination(
        qb: SelectQueryBuilder<AccountingLine>,
        options: PaginationOptions
    ): SelectQueryBuilder<AccountingLine> {
        return qb.skip(options.skip).take(options.take);
    }
}
