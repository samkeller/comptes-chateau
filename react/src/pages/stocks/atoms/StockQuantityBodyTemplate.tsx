import StockItem from "@/interfaces/stocks/StockItem";
import { useState } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";


interface StockQuantityBodyTemplateProps {
    data: StockItem;
    onQuantityChange?: (newQuantity: number) => void;
}

export default function StockQuantityBodyTemplate({ data, onQuantityChange }: StockQuantityBodyTemplateProps) {
    const [editMode, setEditMode] = useState(false);
    const [inputValue, setInputValue] = useState<number>(data.currentQuantity);

    /**
    * Useless function to format the stock quantity for display. It uses French formatting and adjusts decimal places based on whether the quantity is an integer or not.
    * Formats the stock quantity for display, using French formatting and adjusting decimal places based on whether the quantity is an integer or not.
    * @returns 
    */
    const formatStockQuantity = (): string => {
        return new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: Number.isInteger(data.currentQuantity) ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(data.currentQuantity);
    }

    /**
     * Annule l'édition de l'inputNumber.
     */
    const cancelEdit = () => {
        setInputValue(data.currentQuantity);
        setEditMode(false);
    };

    /**
     * Sauvegarde l'édition de l'inputNumber.
     */
    const saveEdit = () => {
        onQuantityChange?.(inputValue);
        setEditMode(false);
    };

    return (
        <div
            className={`
                group
                flex flex-col gap-1
                cursor-pointer
            `}
            onClick={() => {
                if (!editMode) {
                    setInputValue(data.currentQuantity);
                }

                setEditMode(!editMode);
            }}
        >

            <div className="flex justify-between items-center gap-2">
                <div className="text-lg font-semibold">
                    {data.label}
                </div>
                <div
                    className={`
                        flex items-center gap-1
                        opacity-0 pointer-events-none
                        translate-x-1
                        transition-all duration-150
                        group-hover:opacity-100 
                        group-hover:pointer-events-auto
                        group-hover:translate-x-0
                    `}
                >
                    <Button
                        icon="pi pi-minus"
                        size="small"
                        severity="secondary"
                        outlined
                        disabled={data.currentQuantity <= 0} // Désactivé si la quantité est déjà à 0
                        aria-label="Diminuer de 1"
                        tooltip="Diminuer de 1"
                        onClick={e => {
                            e.stopPropagation();
                            onQuantityChange?.(data.currentQuantity - 1);
                        }}
                    />
                    <Button
                        icon="pi pi-plus"
                        size="small"
                        aria-label="Augmenter de 1"
                        tooltip="Augmenter de 1"
                        onClick={e => {
                            e.stopPropagation();
                            onQuantityChange?.(data.currentQuantity + 1);
                        }}
                    />
                </div>
            </div>
            {
                editMode
                    ? (
                        <div className="flex items-center gap-1">
                            <InputNumber
                                value={inputValue}
                                onValueChange={(e) => {
                                    if (e.value !== null && e.value !== undefined) {
                                        setInputValue(e.value);
                                    }
                                }}
                                min={0}
                                mode="decimal"
                                suffix={` ${data.unit}`}
                                minFractionDigits={0}
                                maxFractionDigits={2}
                                autoFocus
                                className="grow"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit();
                                    else if (e.key === "Escape") cancelEdit();
                                }}
                            />

                            <Button
                                icon="pi pi-check"
                                rounded
                                text
                                severity="secondary"
                                size="small"
                                aria-label="Valider"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    saveEdit();
                                }}
                            />
                        </div>
                    )
                    : (
                        <span
                            className="
                                text-surface-500
                                text-sm
                                transition-colors
                                group-hover:text-surface-700
                            "
                        >
                            {formatStockQuantity()} {data.unit}
                        </span>
                    )
            }
        </div >
    )
}
