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

    @Column({ type: "int" })
    itemId: number;

    @ManyToOne("StockItem", (item: StockItem) => item.movements, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "itemId" })
    item: StockItem;

    @Column({ type: "int", nullable: true })
    unitId: number | null;

    @ManyToOne("StockUnit", (unit: StockUnit) => unit.movements, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "unitId" })
    unit: StockUnit | null;

    @Column({ type: "int", nullable: true })
    fromLocationId: number | null;

    @ManyToOne("StockLocation", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "fromLocationId" })
    fromLocation: StockLocation | null;

    @Column({ type: "int", nullable: true })
    toLocationId: number | null;

    @ManyToOne("StockLocation", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "toLocationId" })
    toLocation: StockLocation | null;

    @Column({
        type: "enum",
        enum: STOCK_MOVEMENT_TYPES,
    })
    type: StockMovementType;

    @Column({ type: "double precision" })
    quantity: number;

    @Column({ type: "timestamp" })
    occurredAt: Date;

    @Column({ type: "varchar", length: 50, default: "manual" })
    source: string;

    @CreateDateColumn()
    createdAt: Date;
}
