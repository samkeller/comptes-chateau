import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { AccountLineNature } from "./AccountLineNature";
import { AccountLinePoste } from "./AccountLinePoste";

export enum RecurringExpenseFrequency {
    MONTHLY = 'monthly'
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

    @ManyToOne(() => AccountLineNature)
    @JoinColumn({ name: 'nature_id' })
    nature: AccountLineNature;

    @ManyToOne(() => AccountLinePoste)
    @JoinColumn({ name: 'poste_id' })
    poste: AccountLinePoste;

    @Column({ type: "date", nullable: false, default: () => "CURRENT_DATE" })
    nextOccurrence: Date;

    @Column({ type: "simple-enum", enum: RecurringExpenseFrequency, default: RecurringExpenseFrequency.MONTHLY })
    frequency: RecurringExpenseFrequency
}
