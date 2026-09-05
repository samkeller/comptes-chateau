import {
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Column,
    VirtualColumn,
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

    @VirtualColumn({
        query: (alias) => `(SELECT COUNT(*) FROM stock_unit unit WHERE unit."locationId" = ${alias}.id)`,
        // (SELECT COUNT(*) FROM stock_unit unit WHERE unit."locationId"  = 1)
    })
    stockUnitCount: number;

    @CreateDateColumn()
    createdAt: Date;

}
