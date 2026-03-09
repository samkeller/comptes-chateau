import { ParsedQs } from "qs";
import { parseApiDateString } from "../../../../../utils/ApiDateUtils";

export class QueryParamsValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QueryParamsValidationError";
    }
}

export type QueryFieldParser<T> = (rawValue: string | undefined, fieldName: string) => T;
export type QuerySchema<T extends object> = {
    [K in keyof T]: QueryFieldParser<T[K]>;
};

/**
 * Parse/valide une query string via un schema de champs.
 */
export default class QueryParamsParser {
    /**
     * Parse `req.query` via un schema de parseurs typés.
     *
     * Chaque cle du schema est lue dans `query`, convertie en string unique,
     * puis validee/transformee par le parseur associe.
     * Toute erreur de validation doit lever `QueryParamsValidationError`.
     */
    static parse<T extends object>(query: ParsedQs, schema: QuerySchema<T>): T {
        const parsed = {} as T;

        (Object.keys(schema) as Array<keyof T>).forEach((fieldName) => {
            const parser = schema[fieldName];
            const rawValue = this.getSingleString(query[String(fieldName)]);
            parsed[fieldName] = parser(rawValue, String(fieldName));
        });

        return parsed;
    }

    /**
     * Exige une string non vide.
     */
    static requiredString(rawValue: string | undefined, fieldName: string): string {
        if (!rawValue || rawValue.trim() === "") {
            throw new QueryParamsValidationError(`Query parameter '${fieldName}' is required.`);
        }

        return rawValue.trim();
    }

    /**
     * Exige une date au format `YYYY-MM-DD`.
     */
    static requiredDate(rawValue: string | undefined, fieldName: string): Date {
        const value = QueryParamsParser.requiredString(rawValue, fieldName);

        try {
            return parseApiDateString(value);
        } catch {
            throw new QueryParamsValidationError(
                `Query parameter '${fieldName}' must be a valid date with format YYYY-MM-DD.`
            );
        }
    }

    /**
     * Exige une liste CSV d'entiers, ex: `"1,2,3"`.
     */
    static requiredCsvIntegerList(rawValue: string | undefined, fieldName: string): number[] {
        const value = QueryParamsParser.requiredString(rawValue, fieldName);

        const items = value.split(",").map((entry) => entry.trim());
        if (items.length === 0 || items.every((entry) => entry === "")) {
            throw new QueryParamsValidationError(
                `Query parameter '${fieldName}' must contain at least one integer.`
            );
        }

        const parsed = items.map((entry) => Number.parseInt(entry, 10));
        if (parsed.some(Number.isNaN)) {
            throw new QueryParamsValidationError(
                `Query parameter '${fieldName}' must be a comma-separated list of integers.`
            );
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
