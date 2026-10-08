import { StockBarcodeParamsSchema } from "@chocosous/shared";
import { z } from "zod";
import type { OpenFoodFactsCallOutcome } from "../entities/OpenFoodFactsApiCall";

const OFF_BASE_URL = "https://world.openfoodfacts.org/api/v3/product";
const DEFAULT_CONTACT = "dandrieux.keller@gmail.com";
const TIMEOUT_MS = 3000;

/**
 * Champs OFF conservés localement : de quoi préremplir un produit aujourd'hui
 * et enrichir l'affichage plus tard (catégories, scores, allergènes…) sans rappeler l'API.
 */
export const OPEN_FOOD_FACTS_FIELDS = [
    "product_name",
    "product_name_fr",
    "generic_name_fr",
    "brands",
    "quantity",
    "product_quantity",
    "product_quantity_unit",
    "serving_size",
    "image_front_url",
    "image_front_small_url",
    "categories_tags",
    "labels_tags",
    "allergens_tags",
    "ingredients_text_fr",
    "nutriscore_grade",
    "nova_group",
    "packaging_tags",
] as const;

/**
 * Limites publiées par OFF : 15 lectures produit / minute / IP.
 * On se garde une marge (10 / minute) et on coupe 10 minutes après un 429/503.
 */
export const OPEN_FOOD_FACTS_MAX_CALLS_PER_MINUTE = 10;
const CIRCUIT_OPEN_MS = 10 * 60 * 1000;

export interface OpenFoodFactsFetchResult {
    outcome: OpenFoodFactsCallOutcome;
    httpStatus: number | null;
    durationMs: number;
    /** Champs bruts du produit, `null` si inconnu ou en erreur. */
    product: Record<string, unknown> | null;
}

const productResponseSchema = z.object({
    status: z.string().optional(),
    product: z.record(z.string(), z.unknown()),
});

/**
 * Garde-fou partagé par toutes les instances du client (un seul process Node) :
 * fenêtre glissante d'appels et disjoncteur après un refus d'OFF.
 */
export class OpenFoodFactsThrottle {
    private calls: number[] = [];
    private blockedUntil = 0;

    /** Réserve un appel si le quota local et le disjoncteur le permettent. */
    tryAcquire(now: number = Date.now()): boolean {
        if (now < this.blockedUntil) return false;
        this.calls = this.calls.filter((time) => now - time < 60_000);
        if (this.calls.length >= OPEN_FOOD_FACTS_MAX_CALLS_PER_MINUTE) return false;
        this.calls.push(now);
        return true;
    }

    openCircuit(now: number = Date.now()): void {
        this.blockedUntil = now + CIRCUIT_OPEN_MS;
    }

    reset(): void {
        this.calls = [];
        this.blockedUntil = 0;
    }
}

export const openFoodFactsThrottle = new OpenFoodFactsThrottle();

export function openFoodFactsUserAgent(): string {
    const contact = process.env.OPEN_FOOD_FACTS_CONTACT?.trim() || DEFAULT_CONTACT;
    return `Chocosous/1.0 (${contact})`;
}

/**
 * Client HTTP minimal de l'API produit OFF v3 (lecture seule).
 * Le SDK officiel n'est pas utilisé : voir docs/stocks-openfoodfacts.md.
 */
export default class OpenFoodFactsClient {
    constructor(private readonly throttle: OpenFoodFactsThrottle = openFoodFactsThrottle) {}

    /**
     * Récupère une fiche produit. OFF reste une aide facultative : aucune erreur n'est propagée.
     * @returns `null` si aucun appel n'a été fait (code invalide, quota local atteint, disjoncteur ouvert).
     */
    async fetchProduct(barcode: string): Promise<OpenFoodFactsFetchResult | null> {
        if (!StockBarcodeParamsSchema.safeParse({ barcode }).success) return null;
        if (!this.throttle.tryAcquire()) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const startedAt = Date.now();
        const result = (outcome: OpenFoodFactsCallOutcome, httpStatus: number | null, product: Record<string, unknown> | null = null): OpenFoodFactsFetchResult => ({
            outcome, httpStatus, product, durationMs: Date.now() - startedAt,
        });

        try {
            const response = await fetch(
                `${OFF_BASE_URL}/${barcode}?fields=${OPEN_FOOD_FACTS_FIELDS.join(",")}`,
                {
                    headers: { "User-Agent": openFoodFactsUserAgent() },
                    signal: controller.signal,
                },
            );
            if (response.status === 404) return result("not_found", 404);
            if (response.status === 429 || response.status === 503) {
                this.throttle.openCircuit();
                return result("rate_limited", response.status);
            }
            if (!response.ok) return result("http_error", response.status);

            const payload: unknown = await response.json().catch(() => null);
            if (payload === null) return result("http_error", response.status);
            const parsed = productResponseSchema.safeParse(payload);
            if (!parsed.success || parsed.data.status === "failure") return result("not_found", response.status);
            return result("found", response.status, parsed.data.product);
        } catch {
            return result("network_error", null);
        } finally {
            clearTimeout(timeout);
        }
    }
}
