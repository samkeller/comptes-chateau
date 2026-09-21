import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import { useId } from "react";

interface SourceBadgeProps {
    source: "budget" | "recurring",
    isCompact?: boolean;
}
export default function SourceBadge({ source, isCompact = false }: SourceBadgeProps) {
    const label = source === 'budget' ? "Budget" : "Récurrent";
    const severity = source === 'budget' ? "info" : "success";
    const className = `${isCompact
        ? "cursor min-w-6 p-1"
        : "min-w-18 "
        }`;

    // Compact -> Première lettre
    const value = isCompact ? label.slice(0, 1) : label;

    const id = useId();
    const customId = `source-badge-${source}-${id}`;

    return <>
        {
            isCompact && <Tooltip
                content={label}
                target={"." + customId}
            />
        }
        <Tag
            className={`${className} ${customId}`}
            value={value}
            severity={severity}
            {...(isCompact && {
                rounded: true,
                "data-pr-tooltip": label,
            }
            )}
        />
    </>
}
