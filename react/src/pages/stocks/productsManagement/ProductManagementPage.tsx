import { useState } from "react";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { Message } from "primereact/message";
import { CreateStockItemDto } from "@/services/stocks/dto/CreateStockItemDto";
import StockItemAutocomplete from "../stocksManagement/atoms/StockItemAutocomplete";
import { InputText } from "primereact/inputtext";
import StockItem from "@/interfaces/stocks/StockItem";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import StockUnitEditableList from "./molecules/StockUnitEditableList";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import AppScrollPanel from "@/components/atoms/primereact/AppScrollPanel";
import Optional from "@/components/atoms/form/Optional";
import RequiredMark from "@/components/atoms/form/RequiredMark";
import { Dropdown } from "primereact/dropdown";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";

const stockItemsService = new StockItemsService();
const stockUnitsService = new StockUnitsService();

const EMPTY_FORM_DATA: CreateStockItemDto = {
    label: "",
    defaultUnit: STOCK_UNIT_UNITS[0],
    units: [],
};

export default function ProductManagementPage() {
    const [formData, setFormData] = useState<CreateStockItemDto>(EMPTY_FORM_DATA);

    /**
     * Indique si le stockItem sélectionné dans l'autocomplete est modifié par rapport à la DB.
     * Recharge l'autocomplete. 
     */
    const [stockItemsRefreshKey, setStockItemsRefreshKey] = useState(0);
    const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
    const [savingForm, setSavingForm] = useState(false);

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

    const submitButtonFlavorMessage = () => {
        switch (stockUnitStatus) {
            case "found":
                return "Ce produit existe déjà, vous pouvez l'utiliser tel quel.";

            case "found&edit":
                return "Ce produit existe déjà, mais vous avez modifié ses informations.";

            case "notFound":
                return "Aucun produit ne correspond à ce nom. Il sera créé.";
        }
    };

    /**
     * Recharge les stockUnits du stockItem courant.
     *
     * On utilise cette fonction après chaque mutation d'une stockUnit
     * afin que le formulaire reste synchronisé avec la DB.
     */
    const reloadStockUnits = async (itemId: number) => {
        const units = await stockUnitsService.getStockUnitsByItemId(itemId);

        const transformedUnits: CreateStockUnitDto[] = units.map((unit) => ({
            id: unit.id,
            clientId: crypto.randomUUID(),
            locationId: unit.locationId,
            quantity: unit.quantity,
            unit: unit.unit,
            expirationDate: unit.expirationDate ?? undefined,
        }));

        setFormData((prevFormData) => ({
            ...prevFormData,
            units: transformedUnits,
        }));
    };

    /**
     * Enregistre le stockItem.
     *
     * La sauvegarde du stockItem est indépendante des stockUnits :
     * celles-ci sont persistées individuellement par StockUnitEditableList.
     */
    const submitForm = async () => {
        if (!formData.label.trim() || !formData.defaultUnit.trim()) {
            return;
        }

        setSavingForm(true);

        try {
            const payload: CreateStockItemDto = {
                ...formData,
                label: formData.label.trim(),
            };

            let savedStockItem: StockItem;

            if (selectedStockItem) {
                savedStockItem = await stockItemsService.update(
                    selectedStockItem.id,
                    payload
                );
            } else {
                savedStockItem = await stockItemsService.create(payload);
            }

            // Refraichit toujours l'autocomplete.
            setStockItemsRefreshKey((value) => value + 1);

            setSelectedStockItem(savedStockItem);

            setFormData((prevFormData) => ({
                ...prevFormData,
                id: savedStockItem.id,
                label: savedStockItem.label,
                barcode: savedStockItem.barcode ?? undefined,
                defaultUnit: savedStockItem.defaultUnit,
                imageUrl: savedStockItem.imageUrl ?? undefined,
            }));

            await reloadStockUnits(savedStockItem.id);
        } finally {
            setSavingForm(false);
        }
    };

    /**
     * Sélection d'un stockItem via l'autocomplete.
     */
    const onSelectStockItem = async (stockItem: StockItem) => {
        setSelectedStockItem(stockItem);

        setFormData((prevFormData) => ({
            ...prevFormData,
            id: stockItem.id,
            label: stockItem.label,
            barcode: stockItem.barcode ?? undefined,
            defaultUnit: stockItem.defaultUnit,
            imageUrl: stockItem.imageUrl ?? undefined,
            units: [],
        }));

        await reloadStockUnits(stockItem.id);
    };

    return (
        <FillRemainingHeight>
            <AppScrollPanel direction="vertical">
                <div className="flex flex-col gap-8">
                    <div className="flex justify-end gap-4">
                        {formData.label !== "" && (
                            <Message
                                className="text-sm"
                                content={submitButtonFlavorMessage()}
                                severity="info"
                            />
                        )}

                        <Button
                            label="Enregistrer"
                            icon="pi pi-save"
                            loading={savingForm}
                            disabled={
                                savingForm // Si on est en train de sauvegarder
                                || (!formData.label.trim() || !formData.defaultUnit.trim()) // Ou si les champs obligatoires ne sont pas remplis.
                            }
                            onClick={submitForm}
                        />
                    </div>

                    <div className="flex w-full gap-2">
                        <FloatLabel className="flex-1">
                            <StockItemAutocomplete
                                className="w-full"
                                refreshKey={stockItemsRefreshKey}
                                onChange={(value) => {
                                    if (value.length === 0) {
                                        setSelectedStockItem(null);
                                        // Réinitialise l'objet sans perdre les valeurs déjà saisies dans le formulaire.
                                        setFormData((prevFormData) => ({
                                            ...EMPTY_FORM_DATA,
                                            ...prevFormData,
                                            id: undefined,
                                        }));
                                    }
                                    setFormData((prevFormData) => ({
                                        ...prevFormData,
                                        label: value,
                                    }));
                                }}
                                onSelect={onSelectStockItem}
                            />

                            <label htmlFor="label">
                                Nom du produit
                                <RequiredMark />
                            </label>
                        </FloatLabel>
                    </div>

                    <div className="flex w-full gap-2">
                        <FloatLabel className="flex-1">
                            <InputText
                                id="barcode"
                                className="w-full"
                                value={formData.barcode ?? ""}
                                onChange={(event) => {
                                    setFormData((prevFormData) => ({
                                        ...prevFormData,
                                        barcode: event.target.value,
                                    }));
                                }}
                            />

                            <label htmlFor="barcode">
                                Code-barres
                                <Optional />
                            </label>
                        </FloatLabel>

                        <FloatLabel className="flex-1">
                            <Dropdown
                                id="defaultUnit"
                                className="w-full"
                                value={formData.defaultUnit}
                                options={[...STOCK_UNIT_UNITS]}
                                onChange={(event) => {
                                    setFormData((prevFormData) => ({
                                        ...prevFormData,
                                        defaultUnit: event.value,
                                    }));
                                }}
                            />

                            <label htmlFor="defaultUnit">
                                Unité par défaut
                                <RequiredMark />
                            </label>
                        </FloatLabel>
                    </div>

                    <div className="flex w-full gap-2">
                        <FloatLabel className="flex-1">
                            <InputText
                                id="imageUrl"
                                className="w-full"
                                value={formData.imageUrl ?? ""}
                                onChange={(event) => {
                                    setFormData((prevFormData) => ({
                                        ...prevFormData,
                                        imageUrl: event.target.value,
                                    }));
                                }}
                            />

                            <label htmlFor="imageUrl">
                                URL de l'image
                                <Optional />
                            </label>
                        </FloatLabel>
                    </div>

                    {formData.label.length > 0 && (
                        <div className="flex w-full gap-2">
                            {
                                (formData.id !== undefined) ? (
                                    <StockUnitEditableList
                                        stockItemId={formData.id}
                                        stockItemLabel={formData.label}
                                        stockItemUnit={formData.defaultUnit}
                                        stockUnits={formData.units}
                                        onChange={(newUnits) => {
                                            setFormData((prevFormData) => ({
                                                ...prevFormData,
                                                units: newUnits,
                                            }));
                                        }}
                                    />
                                ) : (
                                    <Message
                                        text="Enregistrez le produit est nécessaire pour pouvoir ajouter des unités."
                                        severity="info"
                                    />
                                )
                            }
                        </div>
                    )}
                </div>
            </AppScrollPanel>
        </FillRemainingHeight>
    );
}