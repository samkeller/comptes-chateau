import { useMemo } from "react";
import { ColumnEvent } from "primereact/column";
import { Uuid } from "@chocosous/shared";
import StockUnit from "@/interfaces/stocks/StockUnit";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { StockUnitUnits } from "@/interfaces/stocks/StockUnit";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";

const stockUnitsService = new StockUnitsService();

export interface StockUnitGroup {
    key: string;
    stockUnits: CreateStockUnitDto[];
    quantity: number;
    unit: StockUnitUnits;
    expirationDate?: Date;
    locationId: number;
}

interface UseStockUnitsEditorParams {
    stockItemId: number;
    stockItemUnit: StockUnitUnits;
    stockUnits: CreateStockUnitDto[];
    stockLocations: StockLocation[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}

/**
 * Logique de gestion des unités de stock d'un produit (regroupement, ajout, mise à jour, suppression).
 * Partagée entre l'affichage desktop (DataTable) et l'affichage mobile (cartes).
 */
export function useStockUnitsEditor({
    stockItemId,
    stockItemUnit,
    stockUnits,
    stockLocations,
    onChange,
}: UseStockUnitsEditorParams) {
    const stockUnitGroups = useMemo<StockUnitGroup[]>(() => {
        const groups = new Map<string, StockUnitGroup>();

        stockUnits.forEach((stockUnit) => {
            const key = JSON.stringify({
                locationId: stockUnit.locationId,
                quantity: stockUnit.quantity,
                unit: stockUnit.unit,
                expirationDate: stockUnit.expirationDate?.getTime() ?? null,
            });

            const existingGroup = groups.get(key);

            if (existingGroup) {
                existingGroup.stockUnits.push(stockUnit);
            } else {
                groups.set(key, {
                    key,
                    stockUnits: [stockUnit],
                    quantity: stockUnit.quantity,
                    unit: stockUnit.unit,
                    expirationDate: stockUnit.expirationDate,
                    locationId: stockUnit.locationId,
                });
            }
        });

        return Array.from(groups.values());
    }, [stockUnits]);

    const isMultipleUnits = (group: StockUnitGroup) => group.stockUnits.length > 1;

    const addStockUnit = async () => {
        if (!stockItemId || stockLocations.length === 0) {
            return;
        }

        onChange([
            ...stockUnits,
            {
                clientId: crypto.randomUUID(),
                locationId: stockLocations[0].id,
                quantity: 1,
                unit: stockItemUnit,
            },
        ]);
    };

    /**
     * Retire une stockUnit du formulaire (optimistic rendering, aucune requête si déjà absente en DB).
     */
    const deleteStockUnitOptimistic = async (clientId: Uuid) => {
        const stockUnit = stockUnits.find((unit) => unit.clientId === clientId);

        if (!stockUnit) {
            return;
        }

        onChange(stockUnits.filter((unit) => unit.clientId !== clientId));
    };

    const updateStockUnit = async (clientId: Uuid, updatedStockUnit: CreateStockUnitDto) => {
        if (!stockItemId) {
            return;
        }

        const currentStockUnit = stockUnits.find((unit) => unit.clientId === clientId);

        if (!currentStockUnit) {
            return;
        }

        const savedUnit: StockUnit =
            currentStockUnit.id === undefined
                ? await stockUnitsService.create(stockItemId, updatedStockUnit)
                : await stockUnitsService.update(currentStockUnit.id, stockItemId, updatedStockUnit);

        const savedDto: CreateStockUnitDto = {
            id: savedUnit.id,
            clientId: currentStockUnit.clientId ?? crypto.randomUUID(),
            locationId: savedUnit.locationId,
            quantity: savedUnit.quantity,
            unit: savedUnit.unit,
            expirationDate: savedUnit.expirationDate ?? undefined,
        };

        onChange(stockUnits.map((unit) => (unit.clientId === clientId ? savedDto : unit)));
    };

    /**
     * Modification d'un groupe : chaque stockUnit du groupe est mise à jour individuellement en DB.
     */
    const onGroupCellEditComplete = async (event: ColumnEvent) => {
        if (!stockItemId) {
            return;
        }

        const group = event.rowData as StockUnitGroup;

        const updatedUnits: CreateStockUnitDto[] = group.stockUnits.map((stockUnit) => ({
            ...stockUnit,
            [event.field]: event.newValue,
        }));

        const savedDtos: CreateStockUnitDto[] = await Promise.all(
            updatedUnits.map(async (stockUnit) => {
                const savedUnit: StockUnit =
                    stockUnit.id === undefined
                        ? await stockUnitsService.create(stockItemId, stockUnit)
                        : await stockUnitsService.update(stockUnit.id, stockItemId, stockUnit);

                return {
                    id: savedUnit.id,
                    clientId: stockUnit.clientId ?? crypto.randomUUID(),
                    locationId: savedUnit.locationId,
                    quantity: savedUnit.quantity,
                    unit: savedUnit.unit,
                    expirationDate: savedUnit.expirationDate ?? undefined,
                };
            })
        );

        const dtoMap = new Map(savedDtos.map((dto) => [dto.clientId, dto]));

        onChange(stockUnits.map((unit) => dtoMap.get(unit.clientId) ?? unit));
    };

    return {
        stockUnitGroups,
        isMultipleUnits,
        addStockUnit,
        updateStockUnit,
        deleteStockUnitOptimistic,
        onGroupCellEditComplete,
    };
}
