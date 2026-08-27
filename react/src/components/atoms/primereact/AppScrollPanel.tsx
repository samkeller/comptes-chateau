import type { ReactNode } from "react";
import { ScrollPanel, type ScrollPanelProps } from "primereact/scrollpanel";

interface AppScrollPanelProps extends ScrollPanelProps {
    children: ReactNode;
    /**
     * Direction of the scroll panel. Can be "vertical", "horizontal", or "both". Defaults to "both".
     * @default "both"
     * @type {"vertical" | "horizontal" | "both"}
     * @memberof AppScrollPanelProps
     * @example
     * <AppScrollPanel direction="vertical">
     *   <div>Content</div>
     * </AppScrollPanel>
     */
    direction?: "vertical" | "horizontal" | "both";
}

export default function AppScrollPanel({
    children,
    direction = "both",
    ...props
}: AppScrollPanelProps) {
    const showHorizontal = direction === "horizontal" || direction === "both";
    const showVertical = direction === "vertical" || direction === "both";

    return (
        <ScrollPanel
            {...props}
            className={`h-full w-full ${props.className ?? ""}`}
            pt={{
                ...props.pt,
                ...(!showHorizontal ? { barX: { className: "hidden!" } } : {}),
                ...(!showVertical ? { barY: { className: "hidden!" } } : {}),
            }}
        >
            {children}
        </ScrollPanel>
    );
}
