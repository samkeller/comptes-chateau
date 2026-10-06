import { createElement, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StockDetailsCard from "./StockDetailsCard";

vi.mock("react", async (importOriginal) => {
    const react = await importOriginal<typeof import("react")>();
    return { ...react, useState: vi.fn(react.useState) };
});

describe("StockDetailsCard", () => {
    it("shows the summary and hides details by default with an accessible expand button", () => {
        const html = renderToStaticMarkup(createElement(StockDetailsCard, {
            title: "Mouvements",
            summary: "3 entrees",
            hasDetails: true,
            children: "Detail du produit",
        }));

        expect(html).toContain("3 entrees");
        expect(html).not.toContain("Detail du produit");
        expect(html).toContain('aria-expanded="false"');
        expect(html).toContain('aria-controls=');
        expect(html).toContain("Afficher le détail : Mouvements");
        expect(html).toContain("pi-chevron-down");
    });

    it("disables expansion when details are unavailable", () => {
        const html = renderToStaticMarkup(createElement(StockDetailsCard, {
            title: "Mouvements",
            summary: "Aucun mouvement",
            hasDetails: false,
            children: "Detail du produit",
        }));

        expect(html).toContain("disabled");
        expect(html).not.toContain("Detail du produit");
    });

    it("replaces the summary with details when expanded", () => {
        vi.mocked(useState).mockReturnValueOnce([true, vi.fn()]);
        const html = renderToStaticMarkup(createElement(StockDetailsCard, {
            title: "Mouvements",
            summary: "3 entrees",
            hasDetails: true,
            children: "Detail du produit",
        }));

        expect(html).toContain("Detail du produit");
        expect(html).not.toContain("3 entrees");
        expect(html).toContain('aria-expanded="true"');
        expect(html).toContain("Masquer le détail : Mouvements");
        expect(html).toContain("pi-chevron-up");
    });
});