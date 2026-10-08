import { addDays } from "date-fns";
import { getStockExpiryState, STOCK_EXPIRING_SOON_DAYS, type StockExpiryState } from "@chocosous/shared";
import { formatApiDate } from "@/utils/DatesUtils";

/** Sévérités PrimeReact (Tag) : seuls les états qui demandent une action sont colorés. */
export type StockExpirySeverity = "danger" | "warning" | null;

export const STOCK_EXPIRY_DISPLAY: Record<StockExpiryState, { label: string; severity: StockExpirySeverity }> = {
    expired: { label: "Périmé", severity: "danger" },
    soon: { label: "Bientôt périmé", severity: "warning" },
    ok: { label: "À consommer", severity: null },
    none: { label: "Sans date", severity: null },
};

/**
 * État de péremption d'une date locale, avec la même règle que le serveur (jours calendaires) :
 * une échéance aujourd'hui n'est pas encore périmée.
 */
export function getLocalExpiryState(expirationDate: Date | null, now: Date = new Date()): StockExpiryState {
    return getStockExpiryState(
        expirationDate ? formatApiDate(expirationDate) : null,
        formatApiDate(now),
        formatApiDate(addDays(now, STOCK_EXPIRING_SOON_DAYS)),
    );
}
