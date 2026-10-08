import { StockBarcodeParamsSchema } from "@chocosous/shared";
import { OpenFoodFacts } from "@openfoodfacts/openfoodfacts-nodejs";
import type { OpenFoodFactsCallOutcome } from "../entities/OpenFoodFactsApiCall";

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

type ProductFieldKey = NonNullable<Parameters<OpenFoodFacts["getProductV3"]>[1]>["fields"];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
 * Lecture de l'API produit OFF v3 via le SDK officiel `@openfoodfacts/openfoodfacts-nodejs`.
 * Le SDK impose son propre User-Agent : on l'écrase pour rester contactable (exigence OFF),
 * et on ajoute un délai maximal. Le statut HTTP (non exposé par le SDK) est relevé au passage pour le journal d'appels.
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
        let httpStatus: number | null = null;
        const result = (outcome: OpenFoodFactsCallOutcome, product: Record<string, unknown> | null = null): OpenFoodFactsFetchResult => ({
            outcome, httpStatus, product, durationMs: Date.now() - startedAt,
        });

        const contactableFetch: typeof fetch = async (input, init) => {
            const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
            headers.set("User-Agent", openFoodFactsUserAgent());
            const response = await globalThis.fetch(input, { ...init, headers, signal: controller.signal });
            httpStatus = response.status;
            return response;
        };

        try {
            const client = new OpenFoodFacts(contactableFetch);
            const { data } = await client.getProductV3(barcode, {
                fields: [...OPEN_FOOD_FACTS_FIELDS] as unknown as ProductFieldKey,
            });
            const status = httpStatus as number | null;
            if (status === 404) return result("not_found");
            if (status === 429 || status === 503) {
                this.throttle.openCircuit();
                return result("rate_limited");
            }
            if (status === null || status < 200 || status >= 300) return result("http_error");
            if (!data) return result("http_error");
            if (data.status === "failure" || !("product" in data) || !isRecord(data.product)) return result("not_found");
            return result("found", data.product);
        } catch {
            return result(httpStatus === null ? "network_error" : "http_error");
        } finally {
            clearTimeout(timeout);
        }
    }
}
