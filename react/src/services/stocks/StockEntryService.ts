import axios from "axios";
import type { SaveStockEntryDto, StockItemWithLotsDto } from "@chocosous/shared";
import BaseService from "../BaseService";

export default class StockEntryService extends BaseService {
    /** Enregistre un produit et ses lots en une seule transaction (création ou modification). */
    async save(entry: SaveStockEntryDto): Promise<StockItemWithLotsDto> {
        const response = await axios.post<StockItemWithLotsDto>(`${this.apiUrl}/stocks/entries`, entry);
        return response.data;
    }
}
