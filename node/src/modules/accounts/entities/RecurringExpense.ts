import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { AccountLineNature } from "./AccountLineNature";
import { AccountLinePoste } from "./AccountLinePoste";
import { Account } from "./Account";

export enum RecurringExpenseFrequency {
    WEEKLY = 'weekly',
    YEARLY = 'yearly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
}

@Entity('recurring_expense')
export class RecurringExpense {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'text' })
    label: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    solde: number

    @Column({ type: "boolean", default: true })
    isActive: boolean

    @Column({ type: "date", nullable: false, default: () => "CURRENT_DATE" })
    nextOccurrence: Date;

    @Column({ type: "simple-enum", enum: RecurringExpenseFrequency, default: RecurringExpenseFrequency.MONTHLY })
    frequency: RecurringExpenseFrequency

    /* ========================
       RELATIONS
    ======================== */
    @ManyToOne(() => AccountLineNature, { nullable: true })
    @JoinColumn({ name: 'nature_id' })
    nature?: AccountLineNature;

    @ManyToOne(() => AccountLinePoste, { nullable: true })
    @JoinColumn({ name: 'poste_id' })
    poste?: AccountLinePoste;

    @Column({ type: "int", name: "account_id" })
    accountId: number;

    @ManyToOne(() => Account, { nullable: false })
    @JoinColumn({ name: "account_id" })
    account: Account;
}
