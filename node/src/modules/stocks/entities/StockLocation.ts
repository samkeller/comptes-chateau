import {
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";
import type { StockUnit } from "./StockUnit";

@Entity("stock_location")
export class StockLocation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @OneToMany("StockUnit", (unit: StockUnit) => unit.location)
    units: StockUnit[];

    @CreateDateColumn()
    createdAt: Date;

}
