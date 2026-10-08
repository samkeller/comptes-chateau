import axios from "axios";
import type { StockDashboardOverviewDto } from "@chocosous/shared";
import BaseService from "../BaseService";
import StockMovement from "@/interfaces/stocks/StockMovement";

export default class StockDashboardService extends BaseService {
    private readonly stocksDashboardUrl = `${this.apiUrl}/stocks/dashboard`;

    async getOverview(): Promise<StockDashboardOverviewDto> {
        const response = await axios.get<StockDashboardOverviewDto>(`${this.stocksDashboardUrl}/overview`);
        return response.data;
    }

    async getLastMovements(limit?: number): Promise<StockMovement[]> {
        const params = limit ? { limit } : {};
        return axios
            .get(`${this.stocksDashboardUrl}/last-movements`, { params })
            .then(r => r.data.map((v: Partial<StockMovement>) => new StockMovement(v)));
    }
}
