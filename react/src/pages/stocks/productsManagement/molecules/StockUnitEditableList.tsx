
import { CreateStockUnitDto } from "../../../../services/stocks/dto/CreateStockUnitDto";
import { DataTable } from "primereact/datatable";
import { Column, ColumnEvent } from "primereact/column";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import StockLocationService from "@/services/stocks/StockLocationService";
import StockUnitEditableListExpansionTemplate from "./StockUnitEditableListExpansionTemplate";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { dateEditor, dropdownEditor } from "@/components/atoms/primereact/datatable/DatatableEditors";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";

/**
 * Représentation d'un groupe de stock units pour la DataTable.
 *
 * Une ligne de la DataTable représente une ou plusieurs `CreateStockUnitDto`
 * qui possèdent exactement les mêmes propriétés métier.
 *
 * Les propriétés `quantity`, `unit`, `expirationDate` et `locationId`
 * sont volontairement dupliquées au niveau du groupe.
 */
export interface StockUnitGroup {
    /**
     * Clé unique pour la DataTable (clef du groupe).
     */
    key: string;
    stockUnits: CreateStockUnitDto[];

    /**
     * Quantité commune à toutes les stock units du groupe.
     * -> Pour primeReact, on ne peut pas utiliser `field="stockUnits[0].quantity"`.
     */
    quantity: number;

    /**
     * Unité commune à toutes les stock units du groupe.
     * -> Pour primeReact, on ne peut pas utiliser `field="stockUnits[0].unit"`.
     */
    unit: string;

    /**
     * Date d'expiration commune à toutes les stock units du groupe.
     * -> Pour primeReact, on ne peut pas utiliser `field="stockUnits[0].expirationDate"`.
     */
    expirationDate?: Date;

    /**
     * Identifiant de l'emplacement commun à toutes les stock units du groupe.
     * -> Pour primeReact, on ne peut pas utiliser `field="stockUnits[0].locationId"`.
     */
    locationId: number;
}

const stockLocationService = new StockLocationService();

interface StockUnitEditableListProps {
    stockUnits: CreateStockUnitDto[];
    onChange: (updatedStockUnits: CreateStockUnitDto[]) => void;
}
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
 * surtout si ils sont identiques (même date d'expiration, même quantité, même unité, même emplacement).
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
    * Regroupement des stock units identiques.
    *
    * Les stock units identiques sont regroupées en une seule ligne visuelle.
    * La première stock unit du groupe sert de référence pour exposer les
    * propriétés communes (`quantity`, `unit`, `locationId`, etc.) directement
    * sur `StockUnitGroup`.
    *
    * Important :
    * `StockUnitGroup` est un ViewModel propre à la DataTable et ne constitue
    * pas une nouvelle source de vérité. Toute modification doit être
    * répercutée dans le tableau `stockUnits` via `onChange`.
    */
    const stockUnitGroups = useMemo<StockUnitGroup[]>(() => {
        const groups = new Map<string, StockUnitGroup>();

        stockUnits.forEach((stockUnit, index) => {
            /**
             * Clef custom pour identifier un groupe de stock units identiques.
             */
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
                    key: key,
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

    /**
     * Ajoute une nouvelle stock unit vide.
     */
    const addStockUnit = () => {
        onChange([
            ...stockUnits,
            {
                id: undefined,
                clientId: crypto.randomUUID(), // Utilisation d'un UUID comme ID temporaire.
                locationId: 0,
                quantity: 1,
                unit: "",
                expirationDate: undefined,
            },
        ]);
    };

    /**
     * Duplique une stock unit.
     */
    const duplicateStockUnit = (clientId: string) => {
        const stockUnit = stockUnits.find(
            stockUnit => stockUnit.clientId === clientId
        );

        if (!stockUnit) {
            return;
        }

        onChange([
            ...stockUnits.slice(0, stockUnits.indexOf(stockUnit) + 1),
            {
                ...stockUnit,
                id: undefined, // Nouvelle stock unit, donc pas d'ID en base.
                clientId: crypto.randomUUID(), // Utilisation d'un UUID comme ID temporaire.
            },
            ...stockUnits.slice(stockUnits.indexOf(stockUnit) + 1),
        ]);
    };

    /**
     * Supprime une stock unit.
     */
    const deleteStockUnit = (clientId: string) => {
        const stockUnit = stockUnits.find(
            stockUnit => stockUnit.clientId === clientId
        );

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
                    // TODO Suppression DB & update retour db
                    stockUnits.filter(stockUnit => stockUnit.clientId !== clientId)
                );
            },
        });
    };

    /**
     * Met à jour une stock unit particulière.
     */
    const updateStockUnit = (
        clientId: string,
        updatedStockUnit: CreateStockUnitDto
    ) => {
        onChange(
            // TODO Update DB & update retour db
            stockUnits.map((stockUnit) =>
                stockUnit.clientId === clientId
                    ? { ...updatedStockUnit, clientId: clientId }
                    : stockUnit
            )
        );
    };

    /**
     * Important: Quand on change un groupe, on doit changer toutes les stock units du groupe.
     * Exemple : on change la quantité d'un groupe de 3 stock units identiques.
     * @param event 
     */
    const onGroupCellEditComplete = (event: ColumnEvent) => {
        const group = event.rowData as StockUnitGroup;

        onChange(
            stockUnits.map((stockUnit) => {
                const belongsToGroup = group.stockUnits.some(
                    (entry) => entry.clientId === stockUnit.clientId
                );

                if (!belongsToGroup) {
                    return stockUnit;
                }

                return {
                    ...stockUnit,
                    [event.field]: event.newValue,
                };
            })
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
                    onClick={() => duplicateStockUnit(firstEntry.clientId)}
                />

                <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    tooltip="Supprimer"
                    onClick={() => deleteStockUnit(firstEntry.clientId)}
                />
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-3">
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
                        stockLocations={stockLocations}
                        updateStockUnit={updateStockUnit}
                        duplicateStockUnit={duplicateStockUnit}
                        deleteStockUnit={deleteStockUnit}
                    />
                )}
                // Important: Quand on change un groupe, on doit changer toutes les stock units du groupe.
                editMode="cell"
                emptyMessage="Rien dans le stock :("
                size="small"
            >
                <Column
                    expander={(group: StockUnitGroup) => group.stockUnits.length > 1}
                    style={{
                        width: "3rem",
                    }}
                />
                <Column
                    field="quantity"
                    header="Quantité"
                    body={(group: StockUnitGroup) => {
                        const firstStockUnit = group.stockUnits[0];

                        /**
                        * Affichage de la quantité dans la ligne principale.
                        *
                        * Exemple :
                        * 3 stock units de quantité 1 => "3 × 1 paquet"
                        * 2 stock units de quantité 5 => "2 × 5 kg"
                        */
                        if (group.stockUnits.length === 1) {
                            return firstStockUnit.quantity;
                        }

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
                    field="unit"
                    header="Unité"
                    body={(group) => group.stockUnits[0].unit}
                    className="cursor-pointer"
                    editor={opts => dropdownEditor(opts, [...STOCK_UNIT_UNITS])}
                    onCellEditComplete={onGroupCellEditComplete} // Propagation à tout le groupe.
                />

                <Column
                    field="expirationDate"
                    header="Expiration"
                    body={(group) => {
                        const expirationDate = group.stockUnits[0].expirationDate;
                        return expirationDate ? expirationDate.toLocaleDateString("fr-FR") : "-";
                    }}
                    className="cursor-pointer"
                    editor={dateEditor}
                    onCellEditComplete={onGroupCellEditComplete} // Propagation à tout le groupe.
                />

                <Column
                    field="locationId"
                    header="Emplacement"
                    body={(group) => {
                        const locationLabel = stockLocations.find((location) => location.id === group.stockUnits[0].locationId)?.label;
                        return locationLabel ?? group.stockUnits[0].locationId;
                    }}
                    className="cursor-pointer"
                    editor={opts => dropdownEditor(opts, stockLocations)}
                    onCellEditComplete={onGroupCellEditComplete} // Propagation à tout le groupe.
                />

                <Column
                    header="Actions"
                    body={groupActionsTemplate}
                />
            </DataTable>
        </div>
    );
}
