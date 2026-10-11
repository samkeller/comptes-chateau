import { describe, expect, it } from "vitest";
import { SaveStockEntrySchema, STOCK_UNIT_UNITS, type StockItemWithLotsDto } from "@chocosous/shared";
import {
    applySuggestion, switchToExistingItem, emptyEntryDraft, entryDraftFromItem,
    toSaveStockEntryDto,
} from "./stockEntryDraft";

const item: StockItemWithLotsDto = {
    id: 4, label: "Lait", barcode: "3017620422003", brand: null, defaultUnit: "pièce", imageUrl: null,
    stockUnitsCount: 3, nextStockUnitExpiration: "2026-10-20", createdAt: "2026-10-01T00:00:00.000Z",
    lots: [
        { locationId: 1, locationLabel: "Cellier", quantity: 1, unit: "L", expirationDate: "2026-10-20", expiryState: "soon", unitIds: [10, 11] },
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

        expect(toSaveStockEntryDto(draft)).toEqual({
            item: { label: "Riz", barcode: "012345678905", brand: null, defaultUnit: "pièce", imageUrl: null },
            lots: [
                { unitIds: [], copies: 2, locationId: 1, quantity: 500, unit: "g", expirationDate: "2027-01-31" },
                { unitIds: [], copies: 1, locationId: 1, quantity: 500, unit: "g", expirationDate: null },
            ],
        });
    });

    it("loads existing lots with canonical units and can append a quick-add lot", () => {
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

    it.each(["boite", "pack"])("preserves historical unit %s when editing and adding a lot", (unit) => {
        const historicalItem: StockItemWithLotsDto = {
            ...item,
            defaultUnit: unit,
            lots: [{ ...item.lots[0], quantity: 2, unit }],
        };
        const draft = entryDraftFromItem(historicalItem, 2);
        draft.item.label = "Lait entier";
        const dto = toSaveStockEntryDto(draft);

        expect(STOCK_UNIT_UNITS).toContain(unit);
        expect(dto.item).toMatchObject({ label: "Lait entier", defaultUnit: unit });
        expect(dto.lots).toEqual([
            expect.objectContaining({ unitIds: [10, 11], quantity: 2, unit }),
            expect.objectContaining({ unitIds: [], quantity: 2, unit }),
        ]);
        expect(SaveStockEntrySchema.parse(dto)).toEqual(dto);
    });

    it("keeps emptied existing lots (deletion) and drops empty new lots", () => {
        const draft = entryDraftFromItem(item, 1);
        draft.lots[0].copies = 0;
        draft.lots[2].copies = 0;
        expect(toSaveStockEntryDto(draft).lots.map((lot) => [lot.unitIds, lot.copies])).toEqual([[[10, 11], 0], [[12], 1]]);
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

    it("keeps pending new lots when switching to an existing product, adopting its content unless edited", () => {
        const draft = emptyEntryDraft(2);
        draft.lots[0].expirationDate = new Date(2026, 11, 1);
        draft.lots.push({ ...draft.lots[0], key: "edited", quantity: 3, unit: "pièce", contentEdited: true });

        const switched = switchToExistingItem(draft, item, 2);
        expect(switched.item.id).toBe(4);
        expect(switched.lots.map(({ unitIds, quantity, unit }) => ({ unitIds, quantity, unit }))).toEqual([
            { unitIds: [10, 11], quantity: 1, unit: "L" },
            { unitIds: [12], quantity: 50, unit: "cl" },
            { unitIds: [], quantity: 1, unit: "L" },
            { unitIds: [], quantity: 3, unit: "pièce" },
        ]);
        expect(switched.lots[2].expirationDate).toEqual(new Date(2026, 11, 1));
        expect(switchToExistingItem({ ...draft, lots: [] }, item, 1).lots).toHaveLength(3);
    });
});
