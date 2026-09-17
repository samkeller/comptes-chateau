import { useState } from "react";
import { Message } from "primereact/message";
import { CreateStockItemDto } from "@/services/stocks/dto/CreateStockItemDto";
import StockItem from "@/interfaces/stocks/StockItem";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import StockUnitEditableList from "./molecules/StockUnitEditableList";
import StockUnitEditableListMobile from "./organisms/StockUnitEditableListMobile";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import AppScrollPanel from "@/components/atoms/primereact/AppScrollPanel";
import { STOCK_UNIT_UNITS, StockUnitUnits } from "@/interfaces/stocks/StockUnit";
import { useScreen } from "@/hooks/useScreen";
import StockItemAutocomplete from "../stocksManagement/atoms/StockItemAutocomplete";
import { FloatLabel } from "primereact/floatlabel";
import RequiredMark from "@/components/atoms/form/RequiredMark";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import ProductOptionalFields from "./molecules/ProductOptionalFields";

const stockItemsService = new StockItemsService();
const stockUnitsService = new StockUnitsService();

const EMPTY_STOCK_ITEM_DTO: CreateStockItemDto = {
    label: "",
    defaultUnit: STOCK_UNIT_UNITS[0],
    units: [],
};

export default function ProductManagementPage() {
    const [formData, setFormData] = useState<CreateStockItemDto>(EMPTY_STOCK_ITEM_DTO);
    const { isDesktop } = useScreen();

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
            case "found&edit":
                return "Le produit a été modifié.";
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

    const onLabelChange = (value: string) => {
        if (value.length === 0) {
            setSelectedStockItem(null);
            // Réinitialise l'objet sans perdre les valeurs déjà saisies dans le formulaire.
            setFormData(() => ({
                ...EMPTY_STOCK_ITEM_DTO,
                id: undefined,
            }));
        }

        setFormData((prevFormData) => ({
            ...prevFormData,
            label: value,
        }));
    };

    const onDefaultUnitChange = (value: StockUnitUnits) => {
        setFormData((prevFormData) => ({ ...prevFormData, defaultUnit: value }));
    };

    const onBarcodeChange = (value: string) => {
        setFormData((prevFormData) => ({ ...prevFormData, barcode: value }));
    };

    const onImageUrlChange = (value: string) => {
        setFormData((prevFormData) => ({ ...prevFormData, imageUrl: value }));
    };

    const onUnitsChange = (newUnits: CreateStockUnitDto[]) => {
        setFormData((prevFormData) => ({ ...prevFormData, units: newUnits }));
    };

    return (
        <FillRemainingHeight offset={50}>
            <AppScrollPanel direction="vertical" >
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col justify-end gap-4 md:flex-row">
                            {
                                formData.label !== "" && stockUnitStatus !== "found" && (
                                    <Message
                                        className="text-sm"
                                        content={submitButtonFlavorMessage()}
                                        severity="info"
                                    />
                                )
                            }

                            <Button
                                label="Enregistrer"
                                icon="pi pi-save"
                                loading={savingForm}
                                disabled={savingForm || !formData.label.trim() || !formData.defaultUnit.trim()}
                                onClick={submitForm}
                            />
                        </div>

                        <div className="flex w-full flex-col gap-8 md:flex-row">
                            <FloatLabel className="w-full flex-1">
                                <StockItemAutocomplete
                                    className="w-full"
                                    refreshKey={stockItemsRefreshKey}
                                    onChange={onLabelChange}
                                    onSelect={onSelectStockItem}
                                />

                                <label htmlFor="label">
                                    Nom du produit
                                    <RequiredMark />
                                </label>
                            </FloatLabel>

                            <FloatLabel className="w-full flex-1">
                                <Dropdown
                                    id="defaultUnit"
                                    className="w-full"
                                    value={formData.defaultUnit}
                                    options={[...STOCK_UNIT_UNITS]}
                                    onChange={(event) => onDefaultUnitChange(event.value)}
                                />

                                <label htmlFor="defaultUnit">
                                    Unité par défaut
                                    <RequiredMark />
                                </label>
                            </FloatLabel>
                        </div>

                        <ProductOptionalFields
                            barcode={formData.barcode}
                            imageUrl={formData.imageUrl}
                            onBarcodeChange={onBarcodeChange}
                            onImageUrlChange={onImageUrlChange}
                        />
                    </div>

                    {formData.label.length > 0 && (
                        <div className="flex w-full">
                            {formData.id !== undefined ? (
                                isDesktop ? (
                                    <StockUnitEditableList
                                        stockItemId={formData.id}
                                        stockItemLabel={formData.label}
                                        stockItemUnit={formData.defaultUnit}
                                        stockUnits={formData.units}
                                        onChange={onUnitsChange}
                                    />
                                ) : (
                                    <StockUnitEditableListMobile
                                        stockItemId={formData.id}
                                        stockItemLabel={formData.label}
                                        stockItemUnit={formData.defaultUnit}
                                        stockUnits={formData.units}
                                        onChange={onUnitsChange}
                                    />
                                )
                            ) : (
                                <Message
                                    text="Enregistrez le produit est nécessaire pour pouvoir ajouter des unités."
                                    severity="info"
                                />
                            )}
                        </div>
                    )}
                </div>
            </AppScrollPanel>
        </FillRemainingHeight>
    );
}