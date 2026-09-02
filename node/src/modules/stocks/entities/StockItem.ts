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

    @Column({ type: "varchar", length: 64, nullable: true })
    barcode: string | null;

    @Column({ type: "varchar", length: 64 })
    defaultUnit: string;

    @Column({ type: "text", nullable: true })
    imageUrl: string | null;

    @OneToMany("StockUnit", (unit: StockUnit) => unit.item)
    units: StockUnit[];

    @CreateDateColumn()
    createdAt: Date;

}
