import { z } from "zod";

export const TableQueryPaginationSchema = z.object({
    skip: z.number().int().min(0),
    take: z.number().int().positive(),
});

export const TableQuerySortSchema = z.object({
    field: z.string().min(1),
    direction: z.enum(["ASC", "DESC"]),
});

export const TableQueryFilterConstraintSchema = z.object({
    matchMode: z.string().min(1),
    value: z.unknown(),
});

export const TableQuerySimpleFilterSchema = z.object({
    type: z.literal("simple"),
    field: z.string().min(1),
    matchMode: z.string().min(1),
    value: z.unknown(),
});

export const TableQueryOperatorFilterSchema = z.object({
    type: z.literal("operator"),
    field: z.string().min(1),
    operator: z.enum(["and", "or"]),
    constraints: z.array(TableQueryFilterConstraintSchema),
});

export const TableQueryFilterSchema = z.discriminatedUnion("type", [
    TableQuerySimpleFilterSchema,
    TableQueryOperatorFilterSchema,
]);

export const TableQueryFiltersSchema = z.array(TableQueryFilterSchema);

/** Contrat API commun des tableaux. Les champs autorisés restent définis par endpoint. */
export const TableQuerySchema = z.object({
    pagination: TableQueryPaginationSchema.optional(),
    sort: TableQuerySortSchema.nullable(),
    filters: TableQueryFiltersSchema,
});

export type TableQueryPagination = z.infer<typeof TableQueryPaginationSchema>;
export type TableQuerySort = z.infer<typeof TableQuerySortSchema>;
export type TableQueryFilterConstraint = z.infer<typeof TableQueryFilterConstraintSchema>;
export type TableQuerySimpleFilter = z.infer<typeof TableQuerySimpleFilterSchema>;
export type TableQueryOperatorFilter = z.infer<typeof TableQueryOperatorFilterSchema>;
export type TableQueryFilter = z.infer<typeof TableQueryFilterSchema>;
export type TableQuery = z.infer<typeof TableQuerySchema>;