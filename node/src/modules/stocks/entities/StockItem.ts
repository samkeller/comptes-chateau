import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { StockMovement } from "./StockMovement";
import type { StockUnit } from "./StockUnit";

@Entity("stock_item")
export class StockItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "varchar", length: 64, nullable: true })
    barcode: string | null;

    @Column({ type: "varchar", length: 64 })
    defaultUnit: string;

    @Column({ type: "text", nullable: true })
    imageUrl: string | null;

    @OneToMany("StockUnit", (unit: StockUnit) => unit.item)
    units: StockUnit[];

    @OneToMany("StockMovement", (movement: StockMovement) => movement.item)
    movements: StockMovement[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
