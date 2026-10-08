import type { EntityManager } from "typeorm";
import JobExecutionLogService from "../modules/core/services/JobExecutionLogService";
import OpenFoodFactsProductService from "../modules/stocks/services/OpenFoodFactsProductService";
import StockItemService from "../modules/stocks/services/StockItemService";

const JOB_NAME = "open-food-facts-sync";

export interface SyncOpenFoodFactsOptions {
    /** Appels OFF maximum par exécution (le reste sera traité aux exécutions suivantes). */
    maxCalls?: number;
    /** Pause entre deux appels, pour rester très en dessous de 15 lectures / minute. */
    delayMs?: number;
    now?: Date;
    sleep?: (ms: number) => Promise<void>;
    productService?: OpenFoodFactsProductService;
}

export interface SyncOpenFoodFactsResult {
    normalizedBarcodes: number;
    fetchedBarcodes: number;
    enrichedItems: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Rétro-compatibilité OpenFoodFacts pour les produits existants, idempotente et limitée en débit :
 * 1. normalise les codes-barres historiques ;
 * 2. enregistre / re-synchronise les fiches OFF en base (au plus `maxCalls` appels) ;
 * 3. complète marque et image des produits sans jamais écraser une saisie utilisateur.
 */
export async function syncOpenFoodFacts(manager: EntityManager, options: SyncOpenFoodFactsOptions = {}): Promise<SyncOpenFoodFactsResult> {
    const { maxCalls = 20, delayMs = 6500, now = new Date(), sleep = defaultSleep } = options;
    const itemService = new StockItemService(manager);
    const productService = options.productService ?? new OpenFoodFactsProductService(manager);
    const logService = new JobExecutionLogService(manager);

    const result: SyncOpenFoodFactsResult = { normalizedBarcodes: 0, fetchedBarcodes: 0, enrichedItems: 0 };
    try {
        const items = await itemService.findAllWithBarcode();
        for (const item of items) {
            if (await itemService.normalizeBarcode(item)) result.normalizedBarcodes++;
        }

        const barcodes = [...new Set(items.map((item) => item.barcode).filter((barcode): barcode is string => !!barcode))];
        for (const barcode of barcodes) {
            if (result.fetchedBarcodes >= maxCalls) break;
            if (!(await productService.needsRefresh(barcode, now))) continue;
            if (result.fetchedBarcodes > 0) await sleep(delayMs);
            await productService.refresh(barcode, "backfill", now);
            result.fetchedBarcodes++;
        }

        for (const item of items) {
            const suggestion = item.barcode ? await productService.getStoredSuggestion(item.barcode) : null;
            if (suggestion && await itemService.enrichFromSuggestion(item, suggestion)) result.enrichedItems++;
        }

        await logService.logSuccess(JOB_NAME, "OpenFoodFacts synchronisé", { ...result });
        return result;
    } catch (error) {
        await logService.logError(JOB_NAME, "Échec de la synchronisation OpenFoodFacts", error);
        throw error;
    }
}
