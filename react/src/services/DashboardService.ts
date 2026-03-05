import axios from "axios";
import BaseService from "./BaseService";
import { MonthlyAggregateByPoste } from "../interfaces/MonthlyAggregateByPoste";
import { DashboardOverview } from "../interfaces/DashboardOverview";
import DashboardMonthlyByPosteQueryCodec from "./dashboardQuery/DashboardMonthlyByPosteQueryCodec";

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
        const params = DashboardMonthlyByPosteQueryCodec.toQueryParams({
            from: fromMonth,
            to: toMonth,
            posteIds
        });

        const query = params.toString();
        const url = `${this.apiUrl}/dashboard/monthly-by-poste${query ? `?${query}` : ""}`;

        return axios.get(url).then((response) => response.data);
    }

    getOverview(): Promise<DashboardOverview> {
        return axios.get(`${this.apiUrl}/dashboard/overview`).then((response) => response.data);
    }
}

export default DashboardService;
