import { describe, expect, it } from "vitest";
import { stockNotifications } from "./stockNotifications";

const NOW = new Date("2026-11-23T10:00:00.000Z");

describe("stockNotifications", () => {
    it("returns nothing when no product expires", () => {
        expect(stockNotifications({ expiredItemLabels: [], expiringSoonItemLabels: [] }, NOW)).toEqual([]);
    });

    it("lists expired and soon-to-expire products in one notification each", () => {
        const result = stockNotifications({
            expiredItemLabels: ["Lait"],
            expiringSoonItemLabels: ["Beurre", "Yaourt", "Jambon", "Crème"],
        }, NOW);

        expect(result).toEqual([
            expect.objectContaining({
                key: "STOCK_EXPIRED:2026-11-23",
                severity: "high",
                title: "1 produit périmé",
                message: "Lait",
                target: { kind: "stocks" },
            }),
            expect.objectContaining({
                key: "STOCK_EXPIRING_SOON:2026-11-23",
                severity: "medium",
                title: "4 produits périment bientôt",
                message: "Beurre, Yaourt, Jambon et 1 autre",
                target: { kind: "stocks" },
            }),
        ]);
    });
});
