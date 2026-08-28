import axios from "axios";
import BaseService from "../BaseService";
import StockMovement from "@/interfaces/stocks/StockMovement";
import StockUnit from "@/interfaces/stocks/StockUnit";
import { StockIntakeDto } from "./dto/StockIntakeDto";
import { TakeStockUnitDto } from "./dto/TakeStockUnitDto";

export default class StockService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks`;

    listAvailableUnits(locationId?: number): Promise<StockUnit[]> {
        return axios.get(`${this.stocksApiUrl}/units`, {
            params: locationId ? { locationId } : undefined,
        }).then((res) =>
            res.data.map((unit: Partial<StockUnit>) => new StockUnit(unit))
        );
    }

    intake(payload: StockIntakeDto): Promise<StockUnit[]> {
        return axios.post(`${this.stocksApiUrl}/intake`, payload).then((res) =>
            res.data.map((unit: Partial<StockUnit>) => new StockUnit(unit))
        );
    }

    takeUnit(unitId: number, payload: TakeStockUnitDto): Promise<StockUnit> {
        return axios.post(`${this.stocksApiUrl}/units/${unitId}/take`, payload).then((res) => new StockUnit(res.data));
    }

    getItemHistory(itemId: number): Promise<StockMovement[]> {
        return axios.get(`${this.stocksApiUrl}/items/${itemId}/history`).then((res) =>
            res.data.map((movement: Partial<StockMovement>) => new StockMovement(movement))
        );
    }
}
