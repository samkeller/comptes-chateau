import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm";
import { STOCK_MOVEMENT_TYPES, type StockMovementType } from "@chocosous/shared";

/**
 * Journal immuable des mouvements de stock.
 *
 * Un mouvement représente une variation historique du stock :
 * - IN     : entrée d'une quantité en stock ;
 * - OUT    : consommation d'une quantité du stock ;
 * - DELETE : suppression d'une quantité du stock, assimilée à une perte/gaspillage.
 *
 * Les identifiants (`itemId`, `unitId`, `locationId`) sont conservés comme
 * références historiques uniquement. Ils ne dépendent pas de l'existence
 * actuelle des entités correspondantes.
 *
 * Les informations métier nécessaires à la compréhension du mouvement
 * (`itemLabel`, `quantity`, `unit`, `locationLabel`) sont stockées directement
 * dans le mouvement afin que l'historique reste exploitable après suppression
 * ou modification des entités d'origine.
 *
 * Le mouvement doit être considéré comme immuable une fois créé.
 */
@Index(
    "UQ_stock_movement_unit_type",
    ["unitId", "type"],
    { unique: true }
)
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

    /**
     * Type du mouvement.
     */
    @Column({
        type: "enum",
        enum: STOCK_MOVEMENT_TYPES,
    })
    type: StockMovementType;

    /**
     * Date et heure auxquelles le mouvement a été enregistré en base.
     */
    @CreateDateColumn()
    createdAt: Date;
}
