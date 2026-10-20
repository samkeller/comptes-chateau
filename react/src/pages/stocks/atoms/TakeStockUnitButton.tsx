
import { useEffect, useState } from "react";
import { showGlobalToast } from "@/services/GlobalToast";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { Button } from "primereact/button";

interface TakeStockUnitButtonProps {
    unitLabel: string;
    unitId: number;
    afterTakeUnit?: () => void;
}

const stockUnitsService = new StockUnitsService();
const CONFIRMATION_DURATION = 3000; // Trois secondes

export default function TakeStockUnitButton({
    unitId,
    unitLabel,
    afterTakeUnit,
}: TakeStockUnitButtonProps) {
    const [confirming, setConfirming] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!confirming) {
            setProgress(100);
            return;
        }

        const start = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(
                Math.max(0, 100 * (1 - elapsed / CONFIRMATION_DURATION))
            );
        }, 30);

        const timeout = setTimeout(() => {
            setConfirming(false);
        }, CONFIRMATION_DURATION);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [confirming]);

    function handleClick() {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        stockUnitsService
            .take(unitId)
            .then(() => {
                showGlobalToast({
                    severity: "success",
                    summary: "Produit pris",
                });

                afterTakeUnit?.();
            })
            .finally(() => setConfirming(false));
    }

    if (confirming) {
        return (

            <span className="relative inline-flex items-center justify-center">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        inset: "-1px",
                        background: `conic-gradient(
                            var(--primary-color) ${progress}%,
                            transparent ${progress}%
                        )`,
                        mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1.5px))",
                        WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1.5px))",
                        transition: "background 200ms ease-out",
                    }}
                />
                <Button
                    icon="pi pi-check"
                    onClick={handleClick}
                    rounded text
                    aria-label={`Confirmer la prise de ${unitLabel}`}
                    tooltip="Confirmer"
                    tooltipOptions={{ position: "top" }}
                />
            </span>
        );
    }

    return (
        <Button
            icon="pi pi-cart-arrow-down"
            onClick={handleClick}
            rounded text
            aria-label={`Prendre ${unitLabel}`}
            tooltip="Prendre"
            tooltipOptions={{ position: "top" }}
        />
    );
}
