import { formatApiDate } from "../ApiDateCodec";

export interface DashboardMonthlyByPosteQueryInput {
    from: Date;
    to: Date;
    posteIds: number[];
}

/**
 * Convertit les filtres dashboard en query params API.
 */
export default class DashboardMonthlyByPosteQueryCodec {
    static toQueryParams(input: DashboardMonthlyByPosteQueryInput): URLSearchParams {
        const params = new URLSearchParams();

        params.append("from", formatApiDate(input.from));
        params.append("to", formatApiDate(input.to));
        params.append("posteIds", input.posteIds.join(","));

        return params;
    }
}
