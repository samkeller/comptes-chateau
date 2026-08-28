import axios from "axios";
import BaseService from "../BaseService";
import StockUnit from "@/interfaces/stocks/StockUnit";
import { StockIntakeDto } from "./dto/StockIntakeDto";
import { TakeStockUnitDto } from "./dto/TakeStockUnitDto";

export default class StockUnitsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/units`;

    getStockUnitsByItemId(itemId: number): Promise<StockUnit[]> {
        return axios.get(`${this.stocksApiUrl}/`, {
            params: { itemId },
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
        return axios.post(`${this.stocksApiUrl}/${unitId}/take`, payload).then((res) => new StockUnit(res.data));
    }

}
