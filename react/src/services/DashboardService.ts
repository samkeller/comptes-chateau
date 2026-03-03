import axios from "axios";
import BaseService from "./BaseService";
import { MonthlyAggregateByPoste } from "../interfaces/MonthlyAggregateByPoste";
import { formatApiDate } from "./ApiDateCodec";

class DashboardService extends BaseService {
    /**
     * Récupère l'agrégation mensuelle par poste
     * @param fromMonth Format YYYY-MM (optionnel)
     * @param toMonth Format YYYY-MM (optionnel)
     */
    getMonthlyByPoste(
        fromMonth: Date,
        toMonth: Date,
        posteIds: number[]
    ): Promise<MonthlyAggregateByPoste[]> {
        const params = new URLSearchParams();
        if (fromMonth) params.append("from", formatApiDate(fromMonth));
        if (toMonth) params.append("to", formatApiDate(toMonth));
        params.append("posteIds", posteIds.join(","));

        const query = params.toString();
        const url = `${this.apiUrl}/dashboard/monthly-by-poste${query ? `?${query}` : ""}`;

        return axios.get(url).then((response) => response.data);
    }
}

export default DashboardService;
