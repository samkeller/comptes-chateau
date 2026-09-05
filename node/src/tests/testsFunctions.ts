import { DataType, type IMemoryDb } from "pg-mem";
import { getMetadataArgsStorage } from "typeorm";
import { StockLocation } from "../modules/stocks/entities/StockLocation";

type ColumnMetadataArgs = ReturnType<typeof getMetadataArgsStorage>["columns"][number];

interface VirtualColumnOverride {
    /* Cible de la colonne virtuelle (la classe de l'entité) */
    target: ColumnMetadataArgs["target"];
    /* Nom de la propriété de la colonne virtuelle */
    propertyName: string;
    /* Requête SQL simulant la colonne virtuelle */
    query: NonNullable<ColumnMetadataArgs["options"]["query"]>;
}

/**
 * Overrides des colonnes virtuelles pour les tests.
 */
const VIRTUAL_COLUMN_OVERRIDES: VirtualColumnOverride[] = [
    {
        target: StockLocation,
        propertyName: "stockUnitCount",
        query: (alias) => `stock_unit_count(${alias}.id)`,
    },
];

/**
 * Enregistre les fonctions de test nécessaires pour pg-mem.
 * @param db 
 */
export function registerTestFunctions(db: IMemoryDb): void {

    db.public.registerFunction({
        name: "stock_unit_count",
        args: [DataType.integer],
        returns: DataType.integer,
        impure: true,
        implementation: (locationId: number) => db.public
            .getTable("stock_unit")
            .find({ locationId })
            .length,
    });
}

/**
 * Applique les overrides des colonnes virtuelles définis pour les tests.
 * @returns 
 */
export function applyVirtualColumnOverrides(): () => void {
    const originals = new Map<ColumnMetadataArgs, ColumnMetadataArgs["options"]["query"]>();

    for (const override of VIRTUAL_COLUMN_OVERRIDES) {
        const column = getMetadataArgsStorage().columns.find(
            (candidate) => candidate.target === override.target
                && candidate.propertyName === override.propertyName
        );

        if (!column) {
            throw new Error(`Virtual column ${override.propertyName} not found`);
        }

        originals.set(column, column.options.query);
        column.options.query = override.query;
    }

    return () => {
        for (const [column, query] of originals) {
            column.options.query = query;
        }
    };
}