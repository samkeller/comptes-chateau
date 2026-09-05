import axios from "axios";
import BaseService from "../BaseService";
import StockItem from "@/interfaces/stocks/StockItem";
import { CreateStockItemDto } from "./dto/CreateStockItemDto";

export default class StockItemsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/items`;

    /**
     * Récupère tous les stockItems, éventuellement filtrés.
     * @param locationId 
     * @returns 
     */
    getAllStockItems(locationId?: number): Promise<StockItem[]> {
        return axios.get(`${this.stocksApiUrl}`, {
            params: {
                ...(locationId ? { locationId } : {}),
            },
        }).then((res) =>
            res.data.map((item: Partial<StockItem>) => new StockItem(item))
        );
    }

    /**
     * Crée un nouveau stockItem.
     * @param payload 
     * @returns 
     */
    create(payload: CreateStockItemDto): Promise<StockItem> {
        return axios.post(`${this.stocksApiUrl}`, payload)
            .then((res) => new StockItem(res.data));
    }

    /**
     * Met à jour un stockItem existant.
     * @param id 
     * @param payload 
     * @returns 
     */
    update(
        id: number,
        payload: CreateStockItemDto
    ): Promise<StockItem> {
        return axios.patch(`${this.stocksApiUrl}/${id}`, payload)
            .then((res) => new StockItem(res.data));
    }
}