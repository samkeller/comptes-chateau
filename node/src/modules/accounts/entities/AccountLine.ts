import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Check
} from "typeorm";
import { AccountLineNature } from "./AccountLineNature";
import { AccountLinePoste } from "./AccountLinePoste";
import { Account } from "./Account";

export enum AccountLineSource {
    SYSTEM = "system",
    MANUAL = "manual",
    IMPORT = "import"
}

@Entity("account_line")
@Check(`"debit" >= 0`)
@Check(`"credit" >= 0`)
@Check(`NOT ("debit" > 0 AND "credit" > 0)`)
@Check(`(("isChecked" = true AND "dateValeur" IS NOT NULL) OR ("isChecked" = false AND "dateValeur" IS NULL))`)
export class AccountLine {

    @PrimaryGeneratedColumn()
    id: number

    /* ========================
       RELATIONS
    ======================== */

    @ManyToOne(() => AccountLineNature, { nullable: true })
    @JoinColumn({ name: "nature_id" })
    nature?: AccountLineNature;

    @ManyToOne(() => AccountLinePoste, { nullable: true })
    @JoinColumn({ name: "poste_id" })
    poste?: AccountLinePoste;

    @ManyToOne(() => Account)
    @JoinColumn({ name: "account_id" })
    account: Account;

    /* ========================
       MONTANTS (mouvement)
    ======================== */

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    debit: number;

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    credit: number;

    /* ========================
       META
    ======================== */

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "boolean", default: false })
    isChecked: boolean;

    @Column({
        type: "enum",
        enum: AccountLineSource,
        default: AccountLineSource.MANUAL
    })
    source: AccountLineSource;

    /* ========================
       DATES
    ======================== */

    @Column({ type: "date" })
    dateOperation: Date

    @Column({ type: "date", nullable: true })
    dateValeur: Date | null

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}