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

@Entity("stock_movement")
export class StockMovement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    itemId: number;

    @ManyToOne("StockItem", (item: StockItem) => item.movements, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "itemId" })
    item: StockItem;

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
