import { ParsedQs } from "qs";
import QueryParamsParser from "./QueryParamsParser";
import { badRequest } from "../../../../../utils/AppError";

export interface DashboardMonthlyByPosteQuery {
    from: Date;
    to: Date;
    posteIds: number[];
}

export default class DashboardMonthlyByPosteQueryParser {
    /**
     * Parse/valide la query de `/dashboard/monthly-by-poste`.
     *
     * Invariants:
     * - `from` et `to` sont requis au format `YYYY-MM-DD`
     * - `posteIds` est une liste CSV d'entiers
     * - `from <= to`
     */
    static parse(query: ParsedQs): DashboardMonthlyByPosteQuery {
        const parsed = QueryParamsParser.parse<DashboardMonthlyByPosteQuery>(query, {
            from: QueryParamsParser.requiredDate,
            to: QueryParamsParser.requiredDate,
            posteIds: QueryParamsParser.requiredCsvIntegerList
        });

        if (parsed.from > parsed.to) {
            throw badRequest("QUERY_VALIDATION", "Query parameter 'from' must be <= 'to'.");
        }

        return parsed;
    }
}
