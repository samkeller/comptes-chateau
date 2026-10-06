import StockUnit from "@/interfaces/stocks/StockUnit";
import BaseService from "../BaseService";
import axios from "axios";

export default class StockDashboardService extends BaseService {
    private readonly stocksDashboardUrl = `${this.apiUrl}/stocks/dashboard`;

    public getExpiringItems(): Promise<StockUnit[]> {
        return axios.get(`${this.stocksDashboardUrl}/expiring-items`).then((res) =>
            res.data.map((unit: Partial<StockUnit>) => new StockUnit(unit))
        );
    }
}