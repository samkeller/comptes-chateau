import type { StockProductSuggestionDto, StockUnitUnits } from "@chocosous/shared";
import { parseStockUnit } from "@chocosous/shared";

const MEASURE_UNITS: ReadonlySet<StockUnitUnits> = new Set(["g", "kg", "ml", "cl", "L"]);

function text(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed || null;
}

function measureUnit(value: unknown): StockUnitUnits | null {
    const candidate = text(value);
    const parsed = candidate ? parseStockUnit(candidate) : null;
    return parsed && MEASURE_UNITS.has(parsed) ? parsed : null;
}

function positiveQuantity(value: unknown): number | null {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (typeof value === "string" && !/^\d+(?:[.,]\d+)?$/.test(value.trim())) return null;
    const parsed = typeof value === "number" ? value : Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function httpUrl(value: unknown): string | null {
    const candidate = text(value);
    if (!candidate) return null;
    try {
        return ["https:", "http:"].includes(new URL(candidate).protocol) ? candidate : null;
    } catch {
        return null;
    }
}

/**
 * Projette les champs OFF bruts (cache local) en suggestion de saisie.
 * Les valeurs absentes ou incohérentes deviennent `null` sans invalider le reste.
 */
export function toProductSuggestion(product: Record<string, unknown>): StockProductSuggestionDto {
    const label = text(product.product_name_fr) ?? text(product.product_name);

    let quantity = positiveQuantity(product.product_quantity);
    let unit = measureUnit(product.product_quantity_unit);
    if (quantity === null || unit === null) {
        // N'inférer qu'une quantité simple, jamais « 6 x 100 g » ou une unité inconnue.
        const fallback = text(product.quantity)?.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)$/i);
        const fallbackQuantity = fallback ? positiveQuantity(fallback[1]) : null;
        if (fallback && fallbackQuantity !== null) {
            quantity = fallbackQuantity;
            unit = measureUnit(fallback[2]);
        } else if (quantity === null) {
            unit = null;
        } else {
            quantity = null;
        }
    }

    return {
        label: label ? (label.charAt(0).toLocaleUpperCase("fr") + label.slice(1)).slice(0, 255) : null,
        brand: text(product.brands)?.split(",")[0].trim().slice(0, 255) || null,
        imageUrl: httpUrl(product.image_front_small_url) ?? httpUrl(product.image_front_url),
        quantity,
        unit,
    };
}
