import axios from "axios";
import type { StockExpiryState, StockItemWithLotsDto } from "@chocosous/shared";
import BaseService from "../BaseService";

export interface StockItemsFilters {
    search?: string;
    locationId?: number | null;
    expiryState?: StockExpiryState | null;
    /** Inclut les produits épuisés (jamais supprimés du catalogue). */
    includeEmpty?: boolean;
}

export default class StockItemsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/items`;

    /** Produits et lots agrégés côté serveur, filtrés et triés par prochaine péremption. */
    async search(filters: StockItemsFilters = {}): Promise<StockItemWithLotsDto[]> {
        const search = filters.search?.trim();
        const response = await axios.get<StockItemWithLotsDto[]>(this.stocksApiUrl, {
            params: {
                ...(search ? { search } : {}),
                ...(filters.locationId ? { locationId: filters.locationId } : {}),
                ...(filters.expiryState ? { expiryState: filters.expiryState } : {}),
                ...(filters.includeEmpty ? { includeEmpty: "true" } : {}),
            },
        });
        return response.data;
    }

    async getOne(id: number): Promise<StockItemWithLotsDto> {
        const response = await axios.get<StockItemWithLotsDto>(`${this.stocksApiUrl}/${id}`);
        return response.data;
    }
}
