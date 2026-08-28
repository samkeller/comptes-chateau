import axios from "axios";
import BaseService from "../BaseService";
import StockItem from "@/interfaces/stocks/StockItem";

export default class StockItemsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/items`;

    getAllStockItems(locationId?: number): Promise<StockItem[]> {

        return axios.get(`${this.stocksApiUrl}`, {
            params: {
                ...(locationId ? { locationId } : {}),
            },
        }).then((res) =>
            res.data.map((item: Partial<StockItem>) => new StockItem(item))
        );
    }
}
