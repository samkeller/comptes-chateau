import { formatApiDate } from "../../utils/DatesUtils";
import type { DashboardMonthlyByPosteQuery } from "@chocosous/shared";

/**
 * Convertit les filtres dashboard en query params API.
 */
export default class DashboardMonthlyByPosteQueryCodec {
    static toQueryParams(input: DashboardMonthlyByPosteQuery): URLSearchParams {
        const params = new URLSearchParams();

        params.append("from", formatApiDate(input.from));
        params.append("to", formatApiDate(input.to));
        params.append("posteIds", input.posteIds.join(","));

        return params;
    }
}
