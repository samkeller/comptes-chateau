import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from "@chocosous/shared";
import type { StockItem } from "./StockItem";
import type { StockLocation } from "./StockLocation";
import type { StockUnit } from "./StockUnit";

@Entity("stock_movement")
export class StockMovement {
    @PrimaryGeneratedColumn()
    id: number;

    /**
    * Identifiant historique du stock item concerné.
    *
    * Pas une foreign key -> le mouvement survit à la suppression du stock item.
    */
    @Column({ type: "int" })
    itemId: number;

    /**
     * Nom du stock item au moment du mouvement.
     */
    @Column({ type: "varchar", length: 255 })
    itemLabel: string;

    /**
     * Identifiant historique de la stock unit concernée.
     * Pas une foreign key -> le mouvement survit à la suppression de l'unité de stock.
     */
    @Column({ type: "int" })
    unitId: number;

    /**
     * Quantité concernée par le mouvement.
     */
    @Column({ type: "double precision" })
    quantity: number;

    /**
     * Unité de mesure de la quantité au moment du mouvement.
     */
    @Column({ type: "varchar", length: 64 })
    unit: string;

    /**
     * Identifiant historique de l'emplacement concerné.
     * Pas une foreign key -> le mouvement survit à la suppression de l'emplacement.
     */
    @Column({ type: "int" })
    locationId: number;

    /**
     * Nom de l'emplacement au moment du mouvement.
     */
    @Column({ type: "varchar", length: 255 })
    locationLabel: string;

    @Column({
        type: "enum",
        enum: STOCK_MOVEMENT_TYPES,
    })
    type: StockMovementType;

    @CreateDateColumn()
    createdAt: Date;
}
