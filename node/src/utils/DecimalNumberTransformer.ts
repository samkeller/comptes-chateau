import type { ValueTransformer } from "typeorm";

/**
 * Hydrate les colonnes PostgreSQL `numeric`/`decimal` en `number`.
 *
 * Le driver `pg` retourne ces valeurs sous forme de chaînes pour préserver une
 * précision arbitraire. Ce transformeur ne doit donc être utilisé que pour les
 * colonnes dont le modèle TypeScript accepte explicitement la précision IEEE-754.
 */
export const decimalNumberTransformer: ValueTransformer = {
    to: (value: number | null | undefined): number | null | undefined => value,
    from: (value: string | number | null): number | null => value === null ? null : Number(value)
};