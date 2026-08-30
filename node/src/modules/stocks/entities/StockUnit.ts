import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { StockItem } from "./StockItem";
import { StockLocation } from "./StockLocation";
import type { StockMovement } from "./StockMovement";

@Entity("stock_unit")
export class StockUnit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    itemId: number;

    @ManyToOne("StockItem", (item: StockItem) => item.units, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "itemId" })
    item: StockItem;

    @Column({ type: "int" })
    locationId: number;

    @ManyToOne(() => StockLocation, (location) => location.units, { nullable: false })
    @JoinColumn({ name: "locationId" })
    location: StockLocation;

    @Column({ type: "double precision" })
    quantity: number;

    @Column({ type: "varchar", length: 64 })
    unit: string;

    @Column({ type: "date", nullable: true })
    expirationDate: string | null;

    @OneToMany("StockMovement", (movement: StockMovement) => movement.unit)
    movements: StockMovement[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}