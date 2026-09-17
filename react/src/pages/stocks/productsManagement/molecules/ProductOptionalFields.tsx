import { useState } from "react";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import Optional from "@/components/atoms/form/Optional";
import { useScreen } from "@/hooks/useScreen";

interface ProductOptionalFieldsProps {
    barcode?: string;
    imageUrl?: string;
    onBarcodeChange: (value: string) => void;
    onImageUrlChange: (value: string) => void;
}

/**
 * Champs secondaires du produit (code-barres, image), repliés par défaut sur mobile pour alléger le formulaire.
 */
export default function ProductOptionalFields({
    barcode,
    imageUrl,
    onBarcodeChange,
    onImageUrlChange,
}: ProductOptionalFieldsProps) {
    const { isDesktop } = useScreen();
    const [isExpanded, setIsExpanded] = useState(isDesktop);

    if (!isExpanded) {
        return (
            <Button
                className="self-start"
                label="Formulaire avancé"
                icon="pi pi-chevron-down"
                text
                onClick={() => setIsExpanded(true)}
            />
        );
    }

    return (
        <div className="flex w-full flex-col gap-8">
            <FloatLabel className="w-full">
                <InputText
                    id="barcode"
                    className="w-full"
                    value={barcode ?? ""}
                    onChange={(event) => onBarcodeChange(event.target.value)}
                />

                <label htmlFor="barcode">
                    Code-barres
                    <Optional />
                </label>
            </FloatLabel>

            <FloatLabel className="w-full">
                <InputText
                    id="imageUrl"
                    className="w-full"
                    value={imageUrl ?? ""}
                    onChange={(event) => onImageUrlChange(event.target.value)}
                />

                <label htmlFor="imageUrl">
                    URL de l'image
                    <Optional />
                </label>
            </FloatLabel>
        </div>
    );
}
