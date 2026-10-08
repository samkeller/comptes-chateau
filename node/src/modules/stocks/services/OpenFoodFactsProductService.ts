import type { StockProductSuggestionDto } from "@chocosous/shared";
import { addDays } from "date-fns";
import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import OpenFoodFactsClient from "../clients/OpenFoodFactsClient";
import type { OpenFoodFactsCallTrigger } from "../entities/OpenFoodFactsApiCall";
import { OpenFoodFactsProduct } from "../entities/OpenFoodFactsProduct";
import { toProductSuggestion } from "../utils/openFoodFactsSuggestion";
import OpenFoodFactsApiCallService from "./OpenFoodFactsApiCallService";

/** Une fiche trouvée est re-synchronisée après 6 mois, un code inconnu est retenté après 7 jours. */
export const OFF_FOUND_REFRESH_DAYS = 180;
export const OFF_NOT_FOUND_REFRESH_DAYS = 7;

/**
 * Données OpenFoodFacts enregistrées en base (table `open_food_facts_product`) : une copie locale durable,
 * synchronisée périodiquement avec OFF, et réutilisable pour enrichir l'application plus tard.
 */
export default class OpenFoodFactsProductService {
    private readonly productRepo: Repository<OpenFoodFactsProduct>;
    private readonly apiCallService: OpenFoodFactsApiCallService;

    constructor(
        em: EntityManager = AppDataSource.manager,
        private readonly client: Pick<OpenFoodFactsClient, "fetchProduct"> = new OpenFoodFactsClient(),
    ) {
        this.productRepo = em.getRepository(OpenFoodFactsProduct);
        this.apiCallService = new OpenFoodFactsApiCallService(em);
    }

    /**
     * Suggestion de saisie pour un code-barres normalisé : données en base d'abord, API OFF si absentes ou à re-synchroniser.
     * Une panne OFF n'est jamais bloquante : on retombe sur les données en base, même anciennes, ou `null`.
     */
    async getSuggestion(barcode: string, trigger: OpenFoodFactsCallTrigger, now: Date = new Date()): Promise<StockProductSuggestionDto | null> {
        const stored = await this.productRepo.findOneBy({ barcode });
        const entry = stored && this.isUpToDate(stored, now) ? stored : await this.refresh(barcode, trigger, now) ?? stored;
        return entry?.status === "found" && entry.product ? toProductSuggestion(entry.product) : null;
    }

    /** Suggestion issue des données en base uniquement (aucun appel réseau). */
    async getStoredSuggestion(barcode: string): Promise<StockProductSuggestionDto | null> {
        const stored = await this.productRepo.findOneBy({ barcode });
        return stored?.status === "found" && stored.product ? toProductSuggestion(stored.product) : null;
    }

    /** Indique si la fiche de ce code-barres doit être (re)synchronisée avec OFF. */
    async needsRefresh(barcode: string, now: Date = new Date()): Promise<boolean> {
        const stored = await this.productRepo.findOneBy({ barcode });
        return !stored || !this.isUpToDate(stored, now);
    }

    /**
     * Interroge OFF et enregistre la fiche en base. Les erreurs transitoires ne remplacent pas une fiche existante.
     * @returns la fiche à jour, ou `null` si OFF n'a pas pu répondre.
     */
    async refresh(barcode: string, trigger: OpenFoodFactsCallTrigger, now: Date = new Date()): Promise<OpenFoodFactsProduct | null> {
        const result = await this.client.fetchProduct(barcode);
        if (!result) return null;
        await this.apiCallService.log(barcode, trigger, result);
        if (result.outcome !== "found" && result.outcome !== "not_found") return null;

        const entry = this.productRepo.create({
            barcode,
            status: result.outcome,
            product: result.product,
            fetchedAt: now,
        });
        return this.productRepo.save(entry);
    }

    private isUpToDate(entry: OpenFoodFactsProduct, now: Date): boolean {
        const refreshDays = entry.status === "found" ? OFF_FOUND_REFRESH_DAYS : OFF_NOT_FOUND_REFRESH_DAYS;
        return addDays(entry.fetchedAt, refreshDays) > now;
    }
}
