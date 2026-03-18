import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { AccountLine } from "./AccountLine";
import { AccountLineNature } from "./AccountLineNature";
import { RecurringExpense } from "./RecurringExpense";
import { BudgetItem } from "./BudgetItem";

@Entity("account")
export class Account {

    @PrimaryColumn({ type: "int", default: 1 })
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    /* ========================
       BASELINE
    ======================== */
    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    baseLineAmount: number;

    @Column({ type: "date" })
    baseLineEffectiveDate: Date;

    /* ========================
       RELATIONS
    ======================== */
    @OneToMany(() => AccountLine, (accountLine) => accountLine.account)
    accountLines: AccountLine[];

    @OneToMany(() => AccountLineNature, (accountLineNature) => accountLineNature.account)
    accountLinesNatures: AccountLineNature[];

    @OneToMany(() => RecurringExpense, (recurringExpense) => recurringExpense.account)
    recurringExpenses: RecurringExpense[];

    @OneToMany(() => BudgetItem, (budgetItem) => budgetItem.account)
    budgetItems: BudgetItem[];
}