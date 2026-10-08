import type { StockBarcodeLookupResponse } from "@chocosous/shared";
import { normalizeBarcode } from "@chocosous/shared";
import { badRequest } from "../../../utils/AppError";
import OpenFoodFactsProductService from "./OpenFoodFactsProductService";
import StockItemService from "./StockItemService";

export default class StockBarcodeLookupService {
    constructor(
        private readonly stockItemService: Pick<StockItemService, "findByBarcode" | "getWithLots"> = new StockItemService(),
        private readonly openFoodFactsProductService: Pick<OpenFoodFactsProductService, "getSuggestion"> = new OpenFoodFactsProductService(),
    ) {}

    /**
     * Produit connu pour ce code-barres (avec ses lots), sinon suggestion OpenFoodFacts (cache local d'abord).
     */
    async lookup(rawBarcode: string): Promise<StockBarcodeLookupResponse> {
        const barcode = normalizeBarcode(rawBarcode);
        if (!barcode) throw badRequest("INVALID_BARCODE", "Code-barres invalide");

        const existing = await this.stockItemService.findByBarcode(barcode);
        return {
            barcode,
            existingItem: existing ? await this.stockItemService.getWithLots(existing.id) : null,
            suggestion: existing ? null : await this.openFoodFactsProductService.getSuggestion(barcode, "lookup"),
        };
    }
}
