import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { newLotDraft } from "@/utils/stocks/stockEntryDraft";
import type { StockLotDraft } from "@/utils/stocks/stockEntryDraft";
import StockLotEditor from "./StockLotEditor";

function renderLot(lot: StockLotDraft): string {
    return renderToStaticMarkup(createElement(StockLotEditor, {
        lot, index: 0, locations: [], onChange: vi.fn(), onRemove: vi.fn(),
    }));
}

describe("StockLotEditor", () => {
    it("associates all five floating labels with their controls", () => {
        const lot = newLotDraft({ locationId: null });
        const html = renderLot(lot);

        for (const field of ["copies", "quantity", "unit", "location", "expiration"]) {
            expect(html).toContain(`for="stock-lot-${lot.key}-${field}"`);
            expect(html).toContain(`id="stock-lot-${lot.key}-${field}"`);
        }
        expect(html.match(/class="p-float-label/g)).toHaveLength(5);
        expect(html).toContain("(optionnel)");
        expect(html).toContain("grid-cols-1");
        expect(html).toContain("sm:grid-cols-2");
    });

    it("uses separate control IDs for separate lots", () => {
        const first = newLotDraft({ locationId: null });
        const second = newLotDraft({ locationId: null });

        expect(first.key).not.toBe(second.key);
        expect(renderLot(first)).not.toContain(`id="stock-lot-${second.key}-copies"`);
    });

    it("keeps an emptied existing lot visible with an undo action", () => {
        const html = renderLot({ ...newLotDraft({ locationId: 1 }), unitIds: [10, 11], copies: 0 });

        expect(html).toContain("sera retiré du stock");
        expect(html).toContain("Annuler");
        expect(html).toContain("pi-undo");
        expect(html).not.toContain("p-float-label");
    });
});