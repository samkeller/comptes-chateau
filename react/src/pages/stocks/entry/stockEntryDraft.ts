import { addDays, addMonths } from "date-fns";
import {
    MAX_STOCK_ENTRY_NEW_COPIES,
    normalizeBarcode,
    normalizeStockUnit,
    type SaveStockEntryDto,
    type StockItemWithLotsDto,
    type StockProductSuggestionDto,
    type StockUnitUnits,
} from "@chocosous/shared";
import { formatApiDate, parseApiDate } from "@/utils/DatesUtils";

/** Champs du produit tels que saisis (chaînes vides = non renseigné). */
export interface StockItemDraft {
    id?: number;
    label: string;
    barcode: string;
    brand: string;
    defaultUnit: StockUnitUnits;
    imageUrl: string;
}

/**
 * Lot saisi : `copies` exemplaires identiques.
 * `unitIds` liste les exemplaires déjà en stock (lot existant) ; un lot existant à 0 exemplaire est retiré.
 */
export interface StockLotDraft {
    key: string;
    unitIds: number[];
    copies: number;
    locationId: number | null;
    quantity: number | null;
    unit: StockUnitUnits;
    expirationDate: Date | null;
}

export interface StockEntryDraft {
    item: StockItemDraft;
    lots: StockLotDraft[];
}

export interface StockLotDefaults {
    locationId: number | null;
    quantity?: number | null;
    unit?: StockUnitUnits;
}

export const EXPIRATION_SHORTCUTS = [
    { label: "+3 j", apply: (today: Date) => addDays(today, 3) },
    { label: "+1 sem.", apply: (today: Date) => addDays(today, 7) },
    { label: "+1 mois", apply: (today: Date) => addMonths(today, 1) },
] as const;

let lotSequence = 0;

export function newLotDraft(defaults: StockLotDefaults): StockLotDraft {
    lotSequence += 1;
    return {
        key: `new-${lotSequence}`,
        unitIds: [],
        copies: 1,
        locationId: defaults.locationId,
        quantity: defaults.quantity ?? 1,
        unit: defaults.unit ?? "pièce",
        expirationDate: null,
    };
}

export function emptyEntryDraft(locationId: number | null): StockEntryDraft {
    return {
        item: { label: "", barcode: "", brand: "", defaultUnit: "pièce", imageUrl: "" },
        lots: [newLotDraft({ locationId })],
    };
}

/**
 * Brouillon à partir d'un produit existant et de ses lots.
 * @param newLotLocationId Si défini, ajoute un nouveau lot vide (ajout rapide d'exemplaires).
 */
export function entryDraftFromItem(item: StockItemWithLotsDto, newLotLocationId?: number | null): StockEntryDraft {
    const defaultUnit = normalizeStockUnit(item.defaultUnit);
    const lots: StockLotDraft[] = item.lots.map((lot) => ({
        key: `lot-${lot.unitIds[0]}`,
        unitIds: lot.unitIds,
        copies: lot.unitIds.length,
        locationId: lot.locationId,
        quantity: lot.quantity,
        unit: normalizeStockUnit(lot.unit),
        expirationDate: parseApiDate(lot.expirationDate),
    }));
    if (newLotLocationId !== undefined) {
        const model = item.lots[0];
        lots.push(newLotDraft({
            locationId: newLotLocationId,
            quantity: model?.quantity ?? 1,
            unit: model ? normalizeStockUnit(model.unit) : defaultUnit,
        }));
    }
    return {
        item: {
            id: item.id,
            label: item.label,
            barcode: item.barcode ?? "",
            brand: item.brand ?? "",
            defaultUnit,
            imageUrl: item.imageUrl ?? "",
        },
        lots,
    };
}

/**
 * Préremplit un nouveau produit avec une suggestion OpenFoodFacts.
 * Ne remplace jamais une valeur déjà saisie par l'utilisateur.
 */
export function applySuggestion(draft: StockEntryDraft, barcode: string, suggestion: StockProductSuggestionDto | null): StockEntryDraft {
    const item: StockItemDraft = {
        ...draft.item,
        barcode,
        label: draft.item.label.trim() ? draft.item.label : suggestion?.label ?? "",
        brand: draft.item.brand.trim() ? draft.item.brand : suggestion?.brand ?? "",
        imageUrl: draft.item.imageUrl.trim() ? draft.item.imageUrl : suggestion?.imageUrl ?? "",
        defaultUnit: suggestion?.unit ?? draft.item.defaultUnit,
    };
    const lots = draft.lots.map((lot) => lot.unitIds.length > 0 || !suggestion?.unit
        ? lot
        : { ...lot, unit: suggestion.unit!, quantity: suggestion.quantity ?? lot.quantity });
    return { item, lots };
}

export function isHttpUrl(value: string): boolean {
    try {
        return ["http:", "https:"].includes(new URL(value.trim()).protocol);
    } catch {
        return false;
    }
}

export function countNewCopies(lots: StockLotDraft[]): number {
    return lots.reduce((total, lot) => total + Math.max(0, lot.copies - lot.unitIds.length), 0);
}

/** Première erreur bloquante du brouillon, en français, ou `null` si la saisie est enregistrable. */
export function getEntryDraftError(draft: StockEntryDraft): string | null {
    if (!draft.item.label.trim()) return "Le nom du produit est obligatoire.";
    if (draft.item.barcode.trim() && !normalizeBarcode(draft.item.barcode)) return "Le code-barres doit contenir 8 à 14 chiffres.";
    if (draft.item.imageUrl.trim() && !isHttpUrl(draft.item.imageUrl)) return "L'image doit être une adresse http(s).";
    for (const lot of draft.lots) {
        if (lot.unitIds.length === 0 && lot.copies < 1) continue;
        if (lot.locationId === null) return "Choisis un lieu pour chaque lot.";
        if (lot.quantity === null || lot.quantity <= 0) return "La quantité de chaque lot doit être positive.";
    }
    if (countNewCopies(draft.lots) > MAX_STOCK_ENTRY_NEW_COPIES) {
        return `${MAX_STOCK_ENTRY_NEW_COPIES} nouveaux exemplaires au maximum par saisie.`;
    }
    return null;
}

/** Contrat envoyé à `POST /stocks/entries`. Les nouveaux lots vides sont ignorés. */
export function toSaveStockEntryDto(draft: StockEntryDraft): SaveStockEntryDto {
    const optional = (value: string): string | null => value.trim() || null;
    return {
        item: {
            ...(draft.item.id !== undefined ? { id: draft.item.id } : {}),
            label: draft.item.label.trim(),
            barcode: optional(draft.item.barcode),
            brand: optional(draft.item.brand),
            defaultUnit: draft.item.defaultUnit,
            imageUrl: optional(draft.item.imageUrl),
        },
        lots: draft.lots
            .filter((lot) => lot.unitIds.length > 0 || lot.copies > 0)
            .map((lot) => ({
                unitIds: lot.unitIds,
                copies: lot.copies,
                locationId: lot.locationId!,
                quantity: lot.quantity!,
                unit: lot.unit,
                expirationDate: lot.expirationDate ? formatApiDate(lot.expirationDate) : null,
            })),
    };
}

/** Saisie « un exemplaire de plus, identique à ce lot » (bouton dupliquer de la liste). */
export function duplicateLotEntry(item: StockItemWithLotsDto, lot: StockItemWithLotsDto["lots"][number]): SaveStockEntryDto {
    return {
        item: { id: item.id, label: item.label, defaultUnit: normalizeStockUnit(item.defaultUnit) },
        lots: [{
            unitIds: [],
            copies: 1,
            locationId: lot.locationId,
            quantity: lot.quantity,
            unit: normalizeStockUnit(lot.unit),
            expirationDate: lot.expirationDate,
        }],
    };
}
