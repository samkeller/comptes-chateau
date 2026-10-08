import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export const OPEN_FOOD_FACTS_PRODUCT_STATUSES = ["found", "not_found"] as const;
export type OpenFoodFactsProductStatus = typeof OPEN_FOOD_FACTS_PRODUCT_STATUSES[number];

/**
 * Cache local des fiches OpenFoodFacts, partagé par tous les produits ayant le même code-barres.
 * Les données brutes (sous-ensemble de champs, licence ODbL) sont conservées pour pouvoir
 * faire évoluer l'affichage sans rappeler l'API.
 */
@Entity("open_food_facts_product")
export class OpenFoodFactsProduct {
    /** Code-barres normalisé. */
    @PrimaryColumn({ type: "varchar", length: 14 })
    barcode: string;

    @Column({ type: "enum", enum: OPEN_FOOD_FACTS_PRODUCT_STATUSES })
    status: OpenFoodFactsProductStatus;

    /** Champs OFF bruts (`null` si produit inconnu). */
    @Column({ type: "jsonb", nullable: true })
    product: Record<string, unknown> | null;

    @Column({ type: "timestamptz" })
    fetchedAt: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt: Date;
}
