import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StockExpirationDate from "./StockExpirationDate";

describe("StockExpirationDate", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 6, 12));
    });

    afterEach(() => vi.useRealTimers());

    it.each([
        { date: new Date(2026, 9, 5), color: "text-error", label: "Périmé" },
        { date: new Date(2026, 9, 7), color: "text-warn", label: "À échéance proche" },
    ])("colors only the alert icon for $label, including the relative date", ({ date, color, label }) => {
        const html = renderToStaticMarkup(createElement(StockExpirationDate, { date, showDistance: true }));
        expect(html).toContain(`pi-exclamation-triangle ${color}`);
        expect(html).toContain(`aria-label="${label}"`);
        expect(html.match(/text-(error|warn)/g)).toHaveLength(1);
        expect(html).toContain(`${date.getDate() === 5 ? "05" : "07"} 10 2026`);
        expect(html).toContain(date.getDate() === 5 ? "il y a" : "dans");
    });

    it("shows distant dates without an icon or severity color", () => {
        const html = renderToStaticMarkup(createElement(StockExpirationDate, { date: new Date(2027, 0, 1) }));
        expect(html).toContain("01 01 2027");
        expect(html).not.toContain("<i ");
        expect(html).not.toMatch(/text-(info|error|warn)/);
    });

    it("preserves the date format supplied by the caller", () => {
        const html = renderToStaticMarkup(createElement(StockExpirationDate, {
            date: new Date(2026, 9, 7),
            children: "07/10/2026",
        }));
        expect(html).toContain("07/10/2026");
        expect(html).not.toContain("07 10 2026");
    });
});