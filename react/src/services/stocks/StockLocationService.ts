import axios from "axios";
import type { CreateStockLocationDto, StockLocationDto } from "@chocosous/shared";
import BaseService from "../BaseService";
import StockLocation from "@/interfaces/stocks/StockLocation";

export default class StockLocationService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/locations`;

    listLocations(): Promise<StockLocation[]> {
        return axios.get(`${this.stocksApiUrl}`).then((res) =>
            res.data.map((location: StockLocationDto) => new StockLocation(location))
        );
    }

    createLocation(payload: CreateStockLocationDto): Promise<StockLocation> {
        return axios.post(`${this.stocksApiUrl}`, payload).then((res) => new StockLocation(res.data));
    }

    updateLocation(id: number, payload: CreateStockLocationDto): Promise<StockLocation> {
        return axios.patch(`${this.stocksApiUrl}/${id}`, payload).then((res) => new StockLocation(res.data));
    }

    deleteLocation(id: number): Promise<void> {
        return axios.delete(`${this.stocksApiUrl}/${id}`);
    }
}
