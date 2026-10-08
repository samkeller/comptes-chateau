import axios from "axios";
import type { StockDashboardOverviewDto, StockMovementDto } from "@chocosous/shared";
import BaseService from "../BaseService";

export default class StockDashboardService extends BaseService {
    private readonly stocksDashboardUrl = `${this.apiUrl}/stocks/dashboard`;

    async getOverview(): Promise<StockDashboardOverviewDto> {
        const response = await axios.get<StockDashboardOverviewDto>(`${this.stocksDashboardUrl}/overview`);
        return response.data;
    }

    async getLastMovements(limit?: number): Promise<StockMovementDto[]> {
        const response = await axios.get<StockMovementDto[]>(`${this.stocksDashboardUrl}/last-movements`, {
            params: limit ? { limit } : {},
        });
        return response.data;
    }
}
