import axios from "axios";
import type { StockBarcodeLookupResponse } from "@chocosous/shared";
import BaseService from "../BaseService";

export default class StockBarcodeService extends BaseService {
    async lookup(barcode: string): Promise<StockBarcodeLookupResponse> {
        const response = await axios.get<StockBarcodeLookupResponse>(
            `${this.apiUrl}/stocks/items/lookup/${encodeURIComponent(barcode)}`
        );
        return response.data;
    }
}
