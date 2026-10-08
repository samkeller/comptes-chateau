import type { StockLotDto } from "@chocosous/shared";
import { getStockExpiryState, normalizeStockUnit, STOCK_EXPIRING_SOON_DAYS } from "@chocosous/shared";
import { addDays } from "date-fns";
import { formatApiDate } from "../../../utils/DateUtils";
import type { StockUnit } from "../entities/StockUnit";

/** Bornes calendaires (`YYYY-MM-DD`) utilisées pour l'état de péremption. */
export interface ExpiryBounds {
    today: string;
    soonLimit: string;
}

export function getExpiryBounds(now: Date = new Date()): ExpiryBounds {
    return {
        today: formatApiDate(now),
        soonLimit: formatApiDate(addDays(now, STOCK_EXPIRING_SOON_DAYS)),
    };
}

/**
 * Regroupe les exemplaires identiques (même lieu, quantité, unité et date) en lots.
 * Les unités historiques (« boite », « pack »…) sont normalisées avant regroupement.
 * Tri : date la plus proche d'abord, sans date en dernier, puis lieu.
 *
 * @param units Exemplaires d'un même produit, avec leur lieu chargé.
 */
export function toStockLots(units: StockUnit[], bounds: ExpiryBounds): StockLotDto[] {
    const lots = new Map<string, StockLotDto>();
    const sortedUnits = [...units].sort((a, b) => a.id - b.id);

    for (const unit of sortedUnits) {
        const unitLabel = normalizeStockUnit(unit.unit);
        const key = [unit.locationId, unit.quantity, unitLabel, unit.expirationDate ?? ""].join("|");
        const lot = lots.get(key);
        if (lot) {
            lot.unitIds.push(unit.id);
            continue;
        }
        lots.set(key, {
            locationId: unit.locationId,
            locationLabel: unit.location?.label ?? "",
            quantity: unit.quantity,
            unit: unitLabel,
            expirationDate: unit.expirationDate ?? null,
            expiryState: getStockExpiryState(unit.expirationDate ?? null, bounds.today, bounds.soonLimit),
            unitIds: [unit.id],
        });
    }

    return [...lots.values()].sort((a, b) => {
        if (a.expirationDate !== b.expirationDate) {
            if (a.expirationDate === null) return 1;
            if (b.expirationDate === null) return -1;
            return a.expirationDate < b.expirationDate ? -1 : 1;
        }
        return a.locationLabel.localeCompare(b.locationLabel, "fr") || a.quantity - b.quantity;
    });
}
