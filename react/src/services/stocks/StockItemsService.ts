import axios from "axios";
import { FilterMatchMode } from "primereact/api";
import type { DataTableFilterMeta } from "primereact/datatable";
import type { StockItemWithLotsDto } from "@chocosous/shared";
import BaseService from "../BaseService";
import DataTableQueryCodec, { type DataTableLazyState } from "../tableQuery/DataTableQueryCodec";

export default class StockItemsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/items`;

    /** Produits et lots filtrés/triés par le backend via le contrat DataTable générique. */
    async search(state: DataTableLazyState, includeEmpty = false): Promise<StockItemWithLotsDto[]> {
        const params = DataTableQueryCodec.toQueryParams(state, { includePagination: false });
        if (includeEmpty) params.set("includeEmpty", "true");
        const response = await axios.get<StockItemWithLotsDto[]>(this.stocksApiUrl, { params });
        return response.data;
    }

    async searchByText(search: string, includeEmpty = false): Promise<StockItemWithLotsDto[]> {
        const filters: DataTableFilterMeta = {
            global: { value: search, matchMode: FilterMatchMode.CONTAINS },
        };
        return this.search({ first: 0, rows: 50, page: 1, sortOrder: 1, filters }, includeEmpty);
    }

    async getOne(id: number): Promise<StockItemWithLotsDto> {
        const response = await axios.get<StockItemWithLotsDto>(`${this.stocksApiUrl}/${id}`);
        return response.data;
    }
}
