import type { DataTablePassThroughOptions, DataTableProps, DataTableValueArray } from "primereact/datatable";
import type { ColumnPassThroughMethodOptions } from "primereact/column";
import { BREAKPOINTS, useScreen } from "@/hooks/useScreen";

/** 
 * Props DataTable pour un layout stack dont les cellules label/valeur restent alignées sur mobile. 
 * */
export function useResponsiveDataTable<T extends DataTableValueArray>(): DataTableProps<T> {
    const { isMobile } = useScreen();
    const pt: DataTablePassThroughOptions | undefined = isMobile
        ? {
            rowGroupHeaderName: { className: "col-span-full block w-full" },
            column: {
                bodyCell: ({ props }: ColumnPassThroughMethodOptions) => {
                    console.log(props);
                    return {
                        className: [
                            "grid! w-full! items-center! justify-start! gap-x-3",
                            props && props.header === ""
                                ? "grid-cols-[minmax(0,1fr)]!"
                                : "grid-cols-[minmax(7.25rem,40%)_minmax(0,1fr)]!",
                        ].join(" "),
                    };
                },
                columnTitle: ({ props }: ColumnPassThroughMethodOptions) => {
                    console.log(props);
                    return props && props.header === ""
                        ? { className: "hidden!" }
                        : undefined;
                },
            },
        }
        : undefined;

    return {
        responsiveLayout: isMobile ? "stack" : "scroll",
        breakpoint: `${BREAKPOINTS.tablet}px`,
        pt: {
            ...(isMobile ? pt : {}),
        },
    };
}