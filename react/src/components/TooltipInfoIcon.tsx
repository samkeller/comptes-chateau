import { Tooltip } from "primereact/tooltip";
import { useId } from "react";

interface TooltipInfoIconProps {
    tooltipText: string,
    type?: "info" | "warning"
}

export default function TooltipInfoIcon({ tooltipText, type = "info" }: TooltipInfoIconProps) {
    const id = useId();
    // id ajoute des ":" -> on les remplace par des "-" pour éviter les problèmes de sélecteurs CSS
    const customId = "tooltip-info-icon-" + id.replace(/:/g, "-");

    const infoClassNames = "pi pi-info-circle text-surface-500";
    const warningClassNames = "pi pi-exclamation-triangle text-orange-500";

    /**
     * Détermine si on est à gauche ou à droite de l'écran
     * @returns 
     */
    const getPosition = () => {
        const element = document.querySelector("." + customId);
        if (!element) {
            return "top";
        }
        const rect = element.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        return rect.left + rect.width / 2 < screenWidth / 2 ? "right" : "left";
    }

    return (
        <>
            <Tooltip target={"." + customId}  position={getPosition()}/>
            <i
                className={customId + " my-auto " + (type === "info" ? infoClassNames : warningClassNames)}
                data-pr-tooltip={tooltipText}
            />

        </>
    )
}