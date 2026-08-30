
import { CreateStockUnitDto } from "../../../../services/stocks/dto/CreateStockUnitDto";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockUnitEditableListExpansionTemplate from "./StockUnitEditableListExpansionTemplate";
import StockLocation from "@/interfaces/stocks/StockLocation";

export interface StockUnitGroup {
    key: string;
    stockUnits: {
        stockUnit: CreateStockUnitDto;
        index: number;
    }[];
}

interface StockUnitEditableListProps {
    stockUnits: CreateStockUnitDto[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}

const stockLocationService = new StockLocationService();

/**
 * Composant pour afficher une liste de stock units éditables.
 * L'idée est de rendre facile la modification des stock units d'un produit.
 * Actions prévues :
 * - Ajouter une nouvelle stock unit (nouvelle ligne dans la liste)
 * - Modifier une stock unit existante (toutes les lignes doivent être facilement editables sur tous les champs)
 * - Supprimer une stock unit (avec un Confirm primeract tout de même)
 * - Dupliquer une stock unit (copie de la ligne)
 * 
 * Attention: Dans cet écran, nous allons "tricher".
 * Nous allons fusionner les stocks semblables (cad tous les champs sont identiques).
 * L'idée est de pouvoir par exemple facilement déclarer qu'on a mis N paquets de pates à tel endroit
 * surtout si ils sont identiques (même date d'expiration, même quantité, même unité, même label).
 * 
 * Cela pose une question supplémentaire pour en "sortir un du lot", par exemple modifier une seule instance de stockUnit
 * quand elles sont affichées ensemble.
 * 
 * @param stockUnits - Liste des stock units à afficher.
 * @param onChange - Fonction appelée lorsque la liste des stock units est modifiée.
 */
export default function StockUnitEditableList({ stockUnits, onChange }: StockUnitEditableListProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);

    useEffect(() => {
        stockLocationService.listLocations().then(setStockLocations);
    }, []);

    /**
     * Génère une clé représentant l'identité visuelle d'une stock unit.
     *
     * Si tous les champs sont identiques, les stock units sont affichées
     * dans le même groupe.
     */
    const getStockUnitGroupKey = (stockUnit: CreateStockUnitDto): string => {
        return JSON.stringify({
            locationId: stockUnit.locationId,
            quantity: stockUnit.quantity,
            unit: stockUnit.unit,
            label: stockUnit.label ?? "",
            expirationDate: stockUnit.expirationDate?.getTime() ?? null,
        });
    };

    /**
     * Regroupement des stock units identiques.
     */
    const stockUnitGroups = useMemo<StockUnitGroup[]>(() => {
        const groups = new Map<string, StockUnitGroup>();

        stockUnits.forEach((stockUnit, index) => {
            const key = getStockUnitGroupKey(stockUnit);

            const existingGroup = groups.get(key);

            if (existingGroup) {
                existingGroup.stockUnits.push({
                    stockUnit,
                    index,
                });
            } else {
                groups.set(key, {
                    key,
                    stockUnits: [
                        {
                            stockUnit,
                            index,
                        },
                    ],
                });
            }
        });

        return Array.from(groups.values());
    }, [stockUnits]);

    /**
     * Ajoute une nouvelle stock unit vide.
     */
    const addStockUnit = () => {
        onChange([
            ...stockUnits,
            {
                locationId: 0,
                quantity: 1,
                unit: "",
                label: "",
                expirationDate: undefined,
            },
        ]);
    };

    /**
     * Duplique une stock unit.
     */
    const duplicateStockUnit = (index: number) => {
        const stockUnit = stockUnits[index];

        if (!stockUnit) {
            return;
        }

        onChange([
            ...stockUnits.slice(0, index + 1),
            {
                ...stockUnit,
            },
            ...stockUnits.slice(index + 1),
        ]);
    };

    /**
     * Supprime une stock unit.
     */
    const deleteStockUnit = (index: number) => {
        const stockUnit = stockUnits[index];

        if (!stockUnit) {
            return;
        }

        confirmDialog({
            message: "Voulez-vous vraiment supprimer cette stock unit ?",
            header: "Supprimer la stock unit",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Supprimer",
            rejectLabel: "Annuler",
            acceptClassName: "p-button-danger",
            accept: () => {
                onChange(
                    stockUnits.filter((_, currentIndex) => currentIndex !== index)
                );
            },
        });
    };

    /**
     * Met à jour une stock unit particulière.
     */
    const updateStockUnit = (
        index: number,
        updatedStockUnit: CreateStockUnitDto
    ) => {
        onChange(
            stockUnits.map((stockUnit, currentIndex) =>
                currentIndex === index
                    ? updatedStockUnit
                    : stockUnit
            )
        );
    };

    /**
     * Actions rapides sur un groupe.
     */
    const groupActionsTemplate = (group: StockUnitGroup) => {
        const firstEntry = group.stockUnits[0];

        if (!firstEntry) {
            return null;
        }

        return (
            <div className="flex items-center gap-1">
                <Button
                    icon="pi pi-copy"
                    text
                    rounded
                    severity="secondary"
                    tooltip="Dupliquer"
                    onClick={() => duplicateStockUnit(firstEntry.index)}
                />

                <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    tooltip="Supprimer"
                    onClick={() => deleteStockUnit(firstEntry.index)}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-3">
            <ConfirmDialog />

            <div className="flex justify-end">
                <Button
                    label="Ajouter une stock unit"
                    icon="pi pi-plus"
                    onClick={addStockUnit}
                />
            </div>

            <DataTable
                value={stockUnitGroups}
                dataKey="key"
                expandedRows={expandedRows}
                onRowToggle={(event) => {
                    setExpandedRows(
                        event.data as Record<string, boolean>
                    );
                }}
                rowExpansionTemplate={(group) => (
                    <StockUnitEditableListExpansionTemplate
                        stockUnitGroup={group}
                        stockUnitGroups={stockUnitGroups}
                        stockLocations={stockLocations}
                        updateStockUnit={updateStockUnit}
                        duplicateStockUnit={duplicateStockUnit}
                        deleteStockUnit={deleteStockUnit}
                    />
                )}
                emptyMessage="Aucune stock unit."
                size="small"
            >
                <Column
                    expander
                    style={{
                        width: "3rem",
                    }}
                />

                <Column
                    header="Produit"
                    body={(group) => group.stockUnits[0].stockUnit.label ?? "-"}
                />

                <Column
                    header="Quantité"
                    body={(group: StockUnitGroup) => {
                        /**
                        * Affichage de la quantité dans la ligne principale.
                        *
                        * Exemple :
                        * 3 stock units de quantité 1 => "3 × 1 paquet"
                        * 2 stock units de quantité 5 => "2 × 5 kg"
                        */
                        if (group.stockUnits.length === 1) {
                            return group.stockUnits[0].stockUnit.quantity;
                        }

                        const firstStockUnit = group.stockUnits[0].stockUnit;

                        return (
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                    {group.stockUnits.length} ×
                                </span>

                                <span>
                                    {firstStockUnit.quantity}
                                </span>
                            </div>
                        );
                    }}
                />

                <Column
                    header="Unité"
                    body={(group) => group.stockUnits[0].stockUnit.unit}
                />

                <Column
                    header="Expiration"
                    body={(group) => {
                        const expirationDate = group.stockUnits[0].stockUnit.expirationDate;
                        return expirationDate ? expirationDate.toLocaleDateString("fr-FR") : "-";
                    }}
                />

                <Column
                    header="Emplacement"
                    body={(group) => {
                        const label = stockLocations.find((location) => location.id === group.stockUnits[0].stockUnit.locationId)?.label;
                        return label ?? group.stockUnits[0].stockUnit.locationId;
                    }}
                />

                <Column
                    header="Actions"
                    body={groupActionsTemplate}
                    style={{
                        width: "8rem",
                    }}
                />
            </DataTable>
        </div>
    );
}
