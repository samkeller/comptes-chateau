import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { StockUnit } from "./StockUnit";

@Entity("stock_item")
export class StockItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    /** Code-barres normalisé (EAN-13 pour un UPC-A). Non unique. */
    @Column({ type: "varchar", length: 64, nullable: true })
    barcode: string | null;

    /** Marque, saisie ou proposée par OpenFoodFacts ; une saisie utilisateur n'est jamais écrasée. */
    @Column({ type: "varchar", length: 255, nullable: true })
    brand: string | null;

    @Column({ type: "varchar", length: 64 })
    defaultUnit: string;

    @Column({ type: "text", nullable: true })
    imageUrl: string | null;

    @OneToMany("StockUnit", (unit: StockUnit) => unit.item)
    units: StockUnit[];

    @CreateDateColumn()
    createdAt: Date;

}
