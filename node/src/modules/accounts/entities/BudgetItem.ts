import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";
import { AccountLinePoste } from "./AccountLinePoste";

@Entity("budget_item")
export class BudgetItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @Column({ type: "int", default: 0 })
    sortOrder: number;

    /* ========================
       RELATIONS
    ======================== */
    @ManyToOne(() => Account, { nullable: false })
    @JoinColumn({ name: "account_id" })
    account: Account;

    @ManyToOne(() => AccountLinePoste, { nullable: true })
    @JoinColumn({ name: "poste_id" })
    poste?: AccountLinePoste | null;
}
