import type { ReactNode } from "react";
import { ScrollPanel, type ScrollPanelProps } from "primereact/scrollpanel";

interface AppScrollPanelProps extends ScrollPanelProps {
    children: ReactNode;
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
                barX: {
                    className: !showHorizontal ? "hidden!" : ""
                },
                barY: {
                    className: !showVertical ? "hidden!" : ""
                }
            }}
        >
            {children}
        </ScrollPanel>
    );
}
