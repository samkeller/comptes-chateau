import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("account_balance_baseline")
export class AccountBalanceBaseline {
    @PrimaryColumn({ type: "int", default: 1 })
    id: number;

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    amount: number;

    @Column({ type: "date" })
    effectiveDate: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
