import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export const OPEN_FOOD_FACTS_CALL_OUTCOMES = ["found", "not_found", "http_error", "network_error", "rate_limited"] as const;
export type OpenFoodFactsCallOutcome = typeof OPEN_FOOD_FACTS_CALL_OUTCOMES[number];

export const OPEN_FOOD_FACTS_CALL_TRIGGERS = ["lookup", "backfill"] as const;
export type OpenFoodFactsCallTrigger = typeof OPEN_FOOD_FACTS_CALL_TRIGGERS[number];

/**
 * Journal des appels réels à l'API OpenFoodFacts : suivi de la consommation
 * (respect des limites, base pour un don à l'association).
 */
@Entity("open_food_facts_api_call")
export class OpenFoodFactsApiCall {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 14 })
    barcode: string;

    @Column({ type: "enum", enum: OPEN_FOOD_FACTS_CALL_TRIGGERS })
    trigger: OpenFoodFactsCallTrigger;

    @Column({ type: "enum", enum: OPEN_FOOD_FACTS_CALL_OUTCOMES })
    outcome: OpenFoodFactsCallOutcome;

    @Column({ type: "int", nullable: true })
    httpStatus: number | null;

    @Column({ type: "int" })
    durationMs: number;

    @Index()
    @CreateDateColumn({ type: "timestamptz" })
    createdAt: Date;
}
