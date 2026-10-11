import type { DataTableProps, DataTableValueArray } from "primereact/datatable";
import type { ColumnPassThroughMethodOptions } from "primereact/column";
import { BREAKPOINTS, useScreen } from "@/hooks/useScreen";

/**
 * Layout stack mobile applique des le premier rendu, sans dependre des styles
 * responsives que PrimeReact 10.9.7 injecte uniquement lors d'une mise a jour.
 */
export function useResponsiveDataTable<T extends DataTableValueArray>(): DataTableProps<T> {
    const { isMobile } = useScreen();
    return {
        responsiveLayout: isMobile ? "stack" : "scroll",
        breakpoint: `${BREAKPOINTS.mobile - 1}px`,
        pt: {
            ...(isMobile && {
                table: { className: "w-full! table-fixed!" },
                thead: { className: "hidden!" },
                tfoot: { className: "hidden!" },
                rowGroupHeaderName: { className: "col-span-full block w-full" },
                column: {
                    bodyCell: ({ props }: ColumnPassThroughMethodOptions) => {
                        return {
                            className: [
                                "grid! w-full! items-center! justify-start! gap-x-3 border-x-0! border-t-0!",
                                props && props.header === ""
                                    ? "grid-cols-[minmax(0,1fr)]!"
                                    : "grid-cols-[minmax(7.25rem,40%)_minmax(0,1fr)]!",
                            ].join(" "),
                        };
                    },
                    columnTitle: ({ props }: ColumnPassThroughMethodOptions) => {
                        return props && props.header === ""
                            ? { className: "hidden!" }
                            : { className: "block!" };
                    },
                },
            }),
        },
    };
}