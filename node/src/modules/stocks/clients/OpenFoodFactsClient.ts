import type { StockBarcodeLookupResponse, StockUnitUnits } from "@chocosous/shared";
import { StockBarcodeParamsSchema } from "@chocosous/shared";
import { z } from "zod";

type Suggestion = NonNullable<StockBarcodeLookupResponse["suggestion"]>;

const productResponseSchema = z.object({
    status: z.literal(1),
    product: z.object({
        product_name: z.unknown().optional(),
        brands: z.unknown().optional(),
        image_front_small_url: z.unknown().optional(),
        product_quantity: z.unknown().optional(),
        product_quantity_unit: z.unknown().optional(),
        quantity: z.unknown().optional(),
    }),
});
const FIELDS = "product_name,brands,image_front_small_url,product_quantity,product_quantity_unit,quantity";

function text(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed || null;
}

function unit(value: unknown): StockUnitUnits | null {
    switch (text(value)?.toLowerCase()) {
        case "g": return "g";
        case "kg": return "kg";
        case "ml": return "ml";
        case "cl": return "cl";
        case "l": return "L";
        default: return null;
    }
}

function positiveQuantity(value: unknown): number | null {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (typeof value === "string" && !/^\d+(?:[.,]\d+)?$/.test(value.trim())) return null;
    const parsed = typeof value === "number" ? value : Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function imageUrl(value: unknown): string | null {
    const candidate = text(value);
    if (!candidate) return null;
    try {
        const parsed = new URL(candidate);
        return ["https:", "http:"].includes(parsed.protocol) ? candidate : null;
    } catch {
        return null;
    }
}

export default class OpenFoodFactsClient {
    /** OFF reste une aide facultative : une panne ou un produit inconnu ne bloque jamais la saisie. */
    async lookup(barcode: string): Promise<Suggestion | null> {
        if (!StockBarcodeParamsSchema.safeParse({ barcode }).success) return null;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${FIELDS}`,
                {
                    headers: { "User-Agent": "Chocosous/1.0 (https://github.com/samkeller/comptes-chateau)" },
                    signal: controller.signal,
                },
            );
            if (!response.ok) return null;
            const payload: unknown = await response.json();
            const parsed = productResponseSchema.safeParse(payload);
            if (!parsed.success) return null;
            const product = parsed.data.product;
            const label = text(product.product_name);

            let quantity = positiveQuantity(product.product_quantity);
            let mappedUnit = unit(product.product_quantity_unit);
            if (quantity === null || mappedUnit === null) {
                // N'inférer qu'une quantité simple, jamais « 6 x 100 g » ou une unité inconnue.
                const fallback = text(product.quantity)?.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)$/i);
                const fallbackQuantity = fallback ? positiveQuantity(fallback[1]) : null;
                if (fallback && fallbackQuantity !== null) {
                    quantity = fallbackQuantity;
                    mappedUnit = unit(fallback[2]);
                } else if (quantity === null) {
                    mappedUnit = null;
                }
            }

            return {
                label: label ? (label.charAt(0).toLocaleUpperCase("fr") + label.slice(1)).slice(0, 255) : null,
                brand: text(product.brands),
                imageUrl: imageUrl(product.image_front_small_url),
                quantity,
                unit: mappedUnit,
            };
        } catch {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }
}
