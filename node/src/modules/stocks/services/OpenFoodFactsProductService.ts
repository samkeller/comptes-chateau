import type { StockProductSuggestionDto } from "@chocosous/shared";
import { addDays } from "date-fns";
import type { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import OpenFoodFactsClient from "../clients/OpenFoodFactsClient";
import type { OpenFoodFactsCallTrigger } from "../entities/OpenFoodFactsApiCall";
import { OpenFoodFactsProduct } from "../entities/OpenFoodFactsProduct";
import { toProductSuggestion } from "../utils/openFoodFactsSuggestion";
import OpenFoodFactsApiCallService from "./OpenFoodFactsApiCallService";

/** Une fiche trouvée est réutilisée 6 mois, un code inconnu est retenté après 7 jours. */
export const OFF_FOUND_TTL_DAYS = 180;
export const OFF_NOT_FOUND_TTL_DAYS = 7;

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
     * Suggestion de saisie pour un code-barres normalisé : cache local d'abord, API OFF si absent ou périmé.
     * Une panne OFF n'est jamais bloquante : on retombe sur le cache, même ancien, ou `null`.
     */
    async getSuggestion(barcode: string, trigger: OpenFoodFactsCallTrigger, now: Date = new Date()): Promise<StockProductSuggestionDto | null> {
        const cached = await this.productRepo.findOneBy({ barcode });
        const entry = cached && this.isFresh(cached, now) ? cached : await this.refresh(barcode, trigger, now) ?? cached;
        return entry?.status === "found" && entry.product ? toProductSuggestion(entry.product) : null;
    }

    /** Suggestion issue du cache local uniquement (aucun appel réseau). */
    async getCachedSuggestion(barcode: string): Promise<StockProductSuggestionDto | null> {
        const cached = await this.productRepo.findOneBy({ barcode });
        return cached?.status === "found" && cached.product ? toProductSuggestion(cached.product) : null;
    }

    /** Indique si le cache doit être (re)chargé pour ce code-barres. */
    async needsRefresh(barcode: string, now: Date = new Date()): Promise<boolean> {
        const cached = await this.productRepo.findOneBy({ barcode });
        return !cached || !this.isFresh(cached, now);
    }

    /**
     * Interroge OFF et met à jour le cache. Les erreurs transitoires ne remplacent pas un cache existant.
     * @returns l'entrée de cache à jour, ou `null` si OFF n'a pas pu répondre.
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

    private isFresh(entry: OpenFoodFactsProduct, now: Date): boolean {
        const ttl = entry.status === "found" ? OFF_FOUND_TTL_DAYS : OFF_NOT_FOUND_TTL_DAYS;
        return addDays(entry.fetchedAt, ttl) > now;
    }
}
