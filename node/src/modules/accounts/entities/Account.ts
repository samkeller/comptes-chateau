import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

@Entity("account")
export class Account {

    @PrimaryColumn({ type: "int", default: 1 })
    id: number;

    /* ========================
       BASELINE
    ======================== */
    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    baseLineAmount: number;

    @Column({ type: "date" })
    baseLineEffectiveDate: Date;
}