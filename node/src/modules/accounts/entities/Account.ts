import { Column, Entity, PrimaryColumn } from "typeorm";
import { decimalNumberTransformer } from "../../../utils/DecimalNumberTransformer";

@Entity("account")
export class Account {

    @PrimaryColumn({ type: "int", default: 1 })
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    /* ========================
       BASELINE
    ======================== */
    @Column({ type: "decimal", precision: 15, scale: 2, default: 0, transformer: decimalNumberTransformer })
    baseLineAmount: number;

    @Column({ type: "date" })
    baseLineEffectiveDate: Date;
}