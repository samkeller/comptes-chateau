import { describe, expect, it } from "vitest";
import type { StockItemWithLotsDto } from "@chocosous/shared";
import {
    applySuggestion, countNewCopies, duplicateLotEntry, emptyEntryDraft, entryDraftFromItem, EXPIRATION_SHORTCUTS,
    getEntryDraftError, toSaveStockEntryDto,
} from "./stockEntryDraft";

const item: StockItemWithLotsDto = {
    id: 4, label: "Lait", barcode: "3017620422003", brand: null, defaultUnit: "boite", imageUrl: null,
    stockUnitsCount: 3, nextStockUnitExpiration: "2026-10-20", createdAt: "2026-10-01T00:00:00.000Z",
    lots: [
        { locationId: 1, locationLabel: "Cellier", quantity: 1, unit: "l", expirationDate: "2026-10-20", expiryState: "soon", unitIds: [10, 11] },
        { locationId: 2, locationLabel: "Frigo", quantity: 50, unit: "cl", expirationDate: null, expiryState: "none", unitIds: [12] },
    ],
};

describe("stock entry draft", () => {
    it("creates a new product with several lots, with or without expiration date", () => {
        const draft = emptyEntryDraft(1);
        draft.item.label = "  Riz ";
        draft.item.barcode = "012345678905";
        draft.lots[0] = { ...draft.lots[0], copies: 2, quantity: 500, unit: "g", expirationDate: new Date(2027, 0, 31) };
        draft.lots.push({ ...draft.lots[0], key: "other", copies: 1, expirationDate: null });

        expect(getEntryDraftError(draft)).toBeNull();
        expect(toSaveStockEntryDto(draft)).toEqual({
            item: { label: "Riz", barcode: "012345678905", brand: null, defaultUnit: "pièce", imageUrl: null },
            lots: [
                { unitIds: [], copies: 2, locationId: 1, quantity: 500, unit: "g", expirationDate: "2027-01-31" },
                { unitIds: [], copies: 1, locationId: 1, quantity: 500, unit: "g", expirationDate: null },
            ],
        });
    });

    it("loads existing lots (legacy units normalized) and can append a quick-add lot", () => {
        const draft = entryDraftFromItem(item, 2);
        expect(draft.item).toMatchObject({ id: 4, defaultUnit: "pièce", barcode: "3017620422003", brand: "" });
        expect(draft.lots.map(({ unitIds, copies, unit, locationId }) => ({ unitIds, copies, unit, locationId }))).toEqual([
            { unitIds: [10, 11], copies: 2, unit: "L", locationId: 1 },
            { unitIds: [12], copies: 1, unit: "cl", locationId: 2 },
            { unitIds: [], copies: 1, unit: "L", locationId: 2 },
        ]);
        expect(draft.lots[0].expirationDate).toEqual(new Date(2026, 9, 20));
        expect(entryDraftFromItem(item).lots).toHaveLength(2);
    });

    it("keeps emptied existing lots (deletion) and drops empty new lots", () => {
        const draft = entryDraftFromItem(item, 1);
        draft.lots[0].copies = 0;
        draft.lots[2].copies = 0;
        expect(toSaveStockEntryDto(draft).lots.map((lot) => [lot.unitIds, lot.copies])).toEqual([[[10, 11], 0], [[12], 1]]);
        expect(countNewCopies(draft.lots)).toBe(0);
    });

    it("prefills from OpenFoodFacts without overwriting typed values", () => {
        const draft = emptyEntryDraft(1);
        draft.item.label = "Mon chocolat";
        const prefilled = applySuggestion(draft, "3017620422003", {
            label: "Pâte à tartiner", brand: "Ferrero", imageUrl: "https://images.openfoodfacts.org/x.jpg", quantity: 400, unit: "g",
        });
        expect(prefilled.item).toMatchObject({ label: "Mon chocolat", brand: "Ferrero", barcode: "3017620422003", defaultUnit: "g" });
        expect(prefilled.lots[0]).toMatchObject({ quantity: 400, unit: "g" });
        expect(applySuggestion(draft, "12345678", null).item).toMatchObject({ label: "Mon chocolat", barcode: "12345678" });
    });

    it.each([
        [(d: ReturnType<typeof emptyEntryDraft>) => { d.item.label = " "; }, "Le nom du produit est obligatoire."],
        [(d: ReturnType<typeof emptyEntryDraft>) => { d.item.barcode = "12"; }, "Le code-barres doit contenir 8 à 14 chiffres."],
        [(d: ReturnType<typeof emptyEntryDraft>) => { d.item.imageUrl = "javascript:alert(1)"; }, "L'image doit être une adresse http(s)."],
        [(d: ReturnType<typeof emptyEntryDraft>) => { d.lots[0].locationId = null; }, "Choisis un lieu pour chaque lot."],
        [(d: ReturnType<typeof emptyEntryDraft>) => { d.lots[0].quantity = 0; }, "La quantité de chaque lot doit être positive."],
        [(d: ReturnType<typeof emptyEntryDraft>) => { d.lots[0].copies = 101; }, "100 nouveaux exemplaires au maximum par saisie."],
    ])("reports blocking errors", (mutate, message) => {
        const draft = emptyEntryDraft(1);
        draft.item.label = "Riz";
        mutate(draft);
        expect(getEntryDraftError(draft)).toBe(message);
    });

    it("offers expiration shortcuts relative to today", () => {
        const today = new Date(2026, 0, 31);
        expect(EXPIRATION_SHORTCUTS.map((shortcut) => shortcut.apply(today))).toEqual([
            new Date(2026, 1, 3), new Date(2026, 1, 7), new Date(2026, 1, 28),
        ]);
    });

    it("duplicates one unit of a lot without touching the product fields", () => {
        expect(duplicateLotEntry(item, item.lots[0])).toEqual({
            item: { id: 4, label: "Lait", defaultUnit: "pièce" },
            lots: [{ unitIds: [], copies: 1, locationId: 1, quantity: 1, unit: "L", expirationDate: "2026-10-20" }],
        });
    });
});
