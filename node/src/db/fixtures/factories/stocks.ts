import type { DeepPartial, EntityManager } from "typeorm";
import { StockItem } from "../../../modules/stocks/entities/StockItem";
import { StockLocation } from "../../../modules/stocks/entities/StockLocation";
import { StockMovement } from "../../../modules/stocks/entities/StockMovement";
import { StockUnit } from "../../../modules/stocks/entities/StockUnit";
import { EntityFactory } from "../EntityFactory";

export class StockItemFactory extends EntityFactory<StockItem> {
    constructor(manager: EntityManager) {
        super(manager, StockItem);
    }

    protected defaults(sequence: number): DeepPartial<StockItem> {
        return { label: `Produit ${sequence}`, defaultUnit: "u", description: null, barcode: null, brand: null, imageUrl: null };
    }
}

export class StockLocationFactory extends EntityFactory<StockLocation> {
    constructor(manager: EntityManager) {
        super(manager, StockLocation);
    }

    protected defaults(sequence: number): DeepPartial<StockLocation> {
        return { label: `Emplacement ${sequence}` };
    }
}

/** Un mouvement est un historique figé : ses ids et libellés ne référencent rien. */
export class StockMovementFactory extends EntityFactory<StockMovement> {
    constructor(manager: EntityManager) {
        super(manager, StockMovement);
    }

    protected defaults(sequence: number): DeepPartial<StockMovement> {
        return {
            itemId: sequence,
            itemLabel: `Produit ${sequence}`,
            unitId: sequence,
            quantity: 1,
            unit: "u",
            locationId: 1,
            locationLabel: "Emplacement",
            type: "IN",
        };
    }
}

export class StockUnitFactory extends EntityFactory<StockUnit, "itemId" | "locationId"> {
    constructor(manager: EntityManager) {
        super(manager, StockUnit);
    }

    protected defaults(): DeepPartial<StockUnit> {
        return { quantity: 1, unit: "u", expirationDate: null };
    }
}
