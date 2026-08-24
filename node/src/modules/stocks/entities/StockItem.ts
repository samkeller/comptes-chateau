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
import { StockLocation } from "./StockLocation";
import { StockMovement } from "./StockMovement";

@Entity("stock_item")
export class StockItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "varchar", length: 64, nullable: true })
    barcode: string | null;

    @Column({ type: "double precision", default: 0 })
    currentQuantity: number;

    @Column({ type: "varchar", length: 64 })
    unit: string;

    @Column({ type: "int" })
    locationId: number;

    @ManyToOne(() => StockLocation, (location) => location.items, { nullable: false })
    @JoinColumn({ name: "locationId" })
    location: StockLocation;

    @Column({ type: "date", nullable: true })
    expirationDate: string | null;

    @Column({ type: "text", nullable: true })
    imageUrl: string | null;

    @OneToMany(() => StockMovement, (movement) => movement.item)
    movements: StockMovement[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;
}
