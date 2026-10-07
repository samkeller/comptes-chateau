import type { StockBarcodeLookupResponse } from "@chocosous/shared";
import OpenFoodFactsClient from "../clients/OpenFoodFactsClient";
import StockItemService from "./StockItemService";

export default class StockBarcodeLookupService {
    constructor(
        private readonly stockItemService: Pick<StockItemService, "findByBarcode"> = new StockItemService(),
        private readonly openFoodFactsClient: Pick<OpenFoodFactsClient, "lookup"> = new OpenFoodFactsClient(),
    ) {}

    async lookup(barcode: string): Promise<StockBarcodeLookupResponse> {
        const existingItem = await this.stockItemService.findByBarcode(barcode);
        return {
            barcode,
            existingItem,
            suggestion: existingItem ? null : await this.openFoodFactsClient.lookup(barcode),
        };
    }
}
