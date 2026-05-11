import axios from "axios";
import BaseService from "./BaseService";
import { MonthlyAggregateByPoste } from "../interfaces/MonthlyAggregateByPoste";
import { DashboardOverview } from "../interfaces/DashboardOverview";
import DashboardMonthlyByPosteQueryCodec from "./dashboardQuery/DashboardMonthlyByPosteQueryCodec";
import { BudgetByPoste } from "@/interfaces/BudgetByPoste";

class DashboardService extends BaseService {
    /**
     * Get monthly aggregation by poste for a specific account.
     * @param accountId - The account ID
     * @param fromMonth - Start date (optional)
     * @param toMonth - End date (optional)
     * @param posteIds - Array of poste IDs to filter by
     */
    getAccountMonthlyByPoste(
        accountId: number,
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
        const url = `${this.apiUrl}/accounts/${accountId}/dashboard/monthly-by-poste${query ? `?${query}` : ""}`;

        return axios.get(url).then((response) => response.data);
    }

    /**
     * Get dashboard overview for a specific account.
     * @param accountId - The account ID
     */
    getAccountOverview(accountId: number): Promise<DashboardOverview> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/dashboard/overview`).then((response) => response.data);
    }

    /**
     * Get budget versus actual amounts grouped by poste for a specific account.
     * @param accountId - The account ID
     */
    getBudgetByPoste(accountId: number): Promise<BudgetByPoste[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/dashboard/budget-vs-actual`).then((response) => response.data);
    }
}

export default DashboardService;
