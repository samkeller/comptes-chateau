import { Tooltip } from "primereact/tooltip";
import { useId } from "react";

interface TooltipInfoIconProps {  
    tooltipText: string;
}

export default function TooltipInfoIcon({ tooltipText }: TooltipInfoIconProps) {
    const id = useId();
    // id ajoute des ":" -> on les remplace par des "-" pour éviter les problèmes de sélecteurs CSS
    const customId = "tooltip-info-icon-" + id.replace(/:/g, "-");
    return (
        <>
            <Tooltip target={"." + customId} />
            <i
                className={customId + " pi pi-info-circle ml-2 my-auto text-sm text-500"}
                data-pr-tooltip={tooltipText}
            />

        </>
    )
}