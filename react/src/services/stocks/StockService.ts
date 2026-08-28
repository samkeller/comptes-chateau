import axios from "axios";
import BaseService from "../BaseService";
import StockItem from "@/interfaces/stocks/StockItem";
import StockMovement from "@/interfaces/stocks/StockMovement";
import { SaveStockItemDto } from "./dto/SaveStockItemDto";
import { RecordStockMovementDto } from "./dto/RecordStockMovementDto";

export default class StockService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks`;
    
    listItems(locationId?: number): Promise<StockItem[]> {
        return axios.get(`${this.stocksApiUrl}/items`, {
            params: locationId ? { locationId } : undefined,
        }).then((res) =>
            res.data.map((item: Partial<StockItem>) => new StockItem(item))
        );
    }

    createItem(payload: SaveStockItemDto): Promise<StockItem> {
        return axios.post(`${this.stocksApiUrl}/items`, payload).then((res) => new StockItem(res.data));
    }

    updateItem(id: number, payload: SaveStockItemDto): Promise<StockItem> {
        return axios.patch(`${this.stocksApiUrl}/items/${id}`, payload).then((res) => new StockItem(res.data));
    }

    deleteItem(id: number): Promise<void> {
        return axios.delete(`${this.stocksApiUrl}/items/${id}`);
    }

    recordMovement(itemId: number, payload: RecordStockMovementDto): Promise<StockItem> {
        return axios.post(`${this.stocksApiUrl}/items/${itemId}/movements`, payload).then((res) => new StockItem(res.data));
    }

    getItemHistory(itemId: number): Promise<StockMovement[]> {
        return axios.get(`${this.stocksApiUrl}/items/${itemId}/history`).then((res) =>
            res.data.map((movement: Partial<StockMovement>) => new StockMovement(movement))
        );
    }
}
