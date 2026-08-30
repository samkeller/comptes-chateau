import { useState } from "react";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { Message } from "primereact/message";
import { CreateStockItemDto } from "@/services/stocks/dto/CreateStockItemDto";
import StockItemAutocomplete from "./atoms/StockItemAutocomplete";
import { InputText } from "primereact/inputtext";
import StockItem from "@/interfaces/stocks/StockItem";
import StockUnitsService from "@/services/stocks/StockUnitsService";

const stockUnitsService = new StockUnitsService()

export default function ProductManagementPage() {
    const [formData, setFormData] = useState<CreateStockItemDto>({
        id: 0,
        label: "",
        defaultUnit: "",
        units: [],
    });

    /**
    * Message concernant l'état du formulaire stockUnit :
    * 1. null : pas de message
    * 2. stockUnit trouvée - on l'utilise telle quelle - champs disabled
    * 3. stockUnit trouvée - on choisit de la modifier - le formulaire est un formulaire de modification
    * 4. stockUnit non trouvée - le formulaire est un formulaire de création
    */
    const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
    const [savingForm, setSavingForm] = useState(false);
    const submitButtonFlavorMessage = () => {
        switch (stockUnitStatus) {
            case "found":
                return "Ce produit existe déjà, vous pouvez l'utiliser tel quel.";
            case "found&edit":
                return "Ce produit existe déjà, mais vous avez modifié ses informations.";
            case "notFound":
                return "Aucun produit ne correspond à ce nom. Il sera créé.";
        }
    }

    const isStockItemModified =
        selectedStockItem !== null &&
        (
            formData.label !== selectedStockItem.label ||
            formData.barcode !== (selectedStockItem.barcode ?? undefined) ||
            formData.defaultUnit !== selectedStockItem.defaultUnit ||
            formData.imageUrl !== (selectedStockItem.imageUrl ?? undefined)
        );

    const stockUnitStatus =
        selectedStockItem === null
            ? "notFound"
            : isStockItemModified
                ? "found&edit"
                : "found";

    const submitForm = async () => {
        setSavingForm(true);
        throw new Error("Not implemented yet");
    }

    /**
     * Séléction d'un stockItem via l'autocomplete.
     * @param stockItem 
     */
    const onSelectStockItem = (stockItem: StockItem) => {
        setSelectedStockItem(stockItem);
        setFormData({
            ...formData,
            id: stockItem.id,
            label: stockItem.label,
            barcode: stockItem.barcode ?? undefined,
            defaultUnit: stockItem.defaultUnit,
            imageUrl: stockItem.imageUrl ?? undefined,
            units: [],
        });
    }

    return (

        <div className="flex flex-col gap-8">
            <div className="flex justify-end gap-4">
                {
                    formData.label !== "" &&
                    <Message
                        className="text-sm"
                        content={submitButtonFlavorMessage()}
                        severity="info"
                    />
                }
                <Button
                    label="Enregistrer"
                    icon="pi pi-plus"
                    onClick={() => submitForm()}
                />
            </div>
            <div className="flex w-full gap-2">
                <FloatLabel className="flex-1">
                    <StockItemAutocomplete
                        className="w-full"
                        onChange={(value) => {
                            setFormData({
                                ...formData,
                                label: value,
                            });
                        }}
                        onSelect={onSelectStockItem}
                    />
                    <label htmlFor="label">Nom du produit</label>
                </FloatLabel>
            </div>
            <div className="flex w-full gap-2">

                <FloatLabel className="flex-1">
                    <InputText
                        id="barcode"
                        className="w-full"
                        value={formData.barcode ?? ""}
                        onChange={(event) => {
                            setFormData({
                                ...formData,
                                barcode: event.target.value,
                            });
                        }}
                    />
                    <label htmlFor="barcode">Code-barres</label>
                </FloatLabel>

                <FloatLabel className="flex-1">
                    <InputText
                        id="defaultUnit"
                        className="w-full"
                        value={formData.defaultUnit}
                        onChange={(event) => {
                            setFormData({
                                ...formData,
                                defaultUnit: event.target.value,
                            });
                        }}
                    />
                    <label htmlFor="defaultUnit">Unité par défaut</label>
                </FloatLabel>
            </div>
            <div className="flex w-full gap-2">
                <FloatLabel className="flex-1">
                    <InputText
                        id="imageUrl"
                        className="w-full"
                        value={formData.imageUrl ?? ""}
                        onChange={(event) => {
                            setFormData({
                                ...formData,
                                imageUrl: event.target.value,
                            });
                        }}
                    />
                    <label htmlFor="imageUrl">URL de l'image</label>
                </FloatLabel>
            </div>

        </div>
    );
}
