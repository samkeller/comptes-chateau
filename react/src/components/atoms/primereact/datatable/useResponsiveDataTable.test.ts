import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { describe, expect, it, vi } from "vitest";
import { BREAKPOINTS, useScreen } from "@/hooks/useScreen";
import { useResponsiveDataTable } from "./useResponsiveDataTable";

vi.mock("@/hooks/useScreen", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/hooks/useScreen")>();
    return { ...original, useScreen: vi.fn() };
});

interface Row {
    id: number;
    label: string;
    copies: number;
}

function ResponsiveTable() {
    const props = useResponsiveDataTable<Row[]>();
    return createElement(DataTable<Row[]>, {
        ...props,
        value: [{ id: 1, label: "Produit", copies: 2 }],
        rowGroupMode: "subheader",
        groupRowsBy: "label",
        rowGroupHeaderTemplate: (row: Row) => row.label,
    },
    createElement(Column, { field: "copies", header: "Compte", style: { width: "8rem" } }),
    createElement(Column, { header: "", body: "Actions", style: { width: "9rem" } }));
}

function renderAtWidth(width: number): string {
    vi.mocked(useScreen).mockReturnValue({
        width,
        height: 800,
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
    });
    return renderToStaticMarkup(createElement(ResponsiveTable));
}

function Breakpoint() {
    return useResponsiveDataTable<Row[]>().breakpoint;
}

describe("useResponsiveDataTable", () => {
    it.each([375, 767])("stacks cells on the initial render at %i px without injected styles", (width) => {
        const html = renderAtWidth(width);

        expect(html).toContain("p-datatable-responsive-stack");
        expect(html).toMatch(/<thead[^>]*class="[^"]*hidden!/);
        expect(html).toMatch(/<table[^>]*class="[^"]*w-full! table-fixed!/);
        expect(html).toMatch(/<td[^>]*class="[^"]*grid! w-full!/);
        expect(html).toContain("grid-cols-[minmax(7.25rem,40%)_minmax(0,1fr)]!");
        expect(html).toContain("grid-cols-[minmax(0,1fr)]!");
        expect(html).toMatch(/<span[^>]*class="[^"]*p-column-title block!"/);
        expect(html).toMatch(/<span[^>]*class="[^"]*p-column-title[^"]*hidden!"/);
        expect(html).toMatch(/<td colSpan="2"[^>]*class="[^"]*grid! w-full!/);
        expect(html).toContain("p-rowgroup-header-name col-span-full block w-full");
    });

    it.each([768, 1024, 1280])("preserves the regular table at %i px", (width) => {
        const html = renderAtWidth(width);

        expect(html).toContain("p-datatable-responsive-scroll");
        expect(html).not.toContain("hidden!");
        expect(html).not.toContain("grid!");
        expect(html).not.toContain('data-pc-section="columntitle"');
        expect(html).toContain('width:8rem');
    });

    it("uses the application's mobile boundary for PrimeReact's media query", () => {
        renderAtWidth(375);
        expect(renderToStaticMarkup(createElement(Breakpoint))).toBe("767px");
    });
});
