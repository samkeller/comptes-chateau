import StockUnit from "@/interfaces/stocks/StockUnit";
import BaseService from "../BaseService";
import axios from "axios";
import type { StockDashboardOverviewDto, StockMovementDto } from "@chocosous/shared";

export default class StockDashboardService extends BaseService {
    private readonly stocksDashboardUrl = `${this.apiUrl}/stocks/dashboard`;

    public getExpiringItems(): Promise<StockUnit[]> {
        return axios.get(`${this.stocksDashboardUrl}/expiring-items`).then((res) =>
            res.data.map((unit: Partial<StockUnit>) => new StockUnit(unit))
        );
    }
    
    public async getOverview(): Promise<StockDashboardOverviewDto> {
        const response = await axios.get<StockDashboardOverviewDto>(`${this.stocksDashboardUrl}/overview`);
        return response.data;
    }

    public async getLastMovements(): Promise<StockMovementDto[]> {
        const response = await axios.get<StockMovementDto[]>(`${this.stocksDashboardUrl}/last-movements`);
        return response.data;
    }
}