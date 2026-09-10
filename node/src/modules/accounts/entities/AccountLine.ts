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
import { decimalNumberTransformer } from "../../../utils/DecimalNumberTransformer";

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
// Une opération liée (virement inter-comptes) a TOUJOURS transfer_group_id ET target_account_id
// renseignés ; une opération simple n'a NI l'un NI l'autre. Jamais un seul des deux.
@Check(`(("transfer_group_id" IS NOT NULL AND "target_account_id" IS NOT NULL) OR ("transfer_group_id" IS NULL AND "target_account_id" IS NULL))`)
export class AccountLine {

    @PrimaryGeneratedColumn()
    id: number

    /* ========================
       RELATIONS
    ======================== */

    @ManyToOne(() => AccountLineNature, { nullable: true })
    @JoinColumn({ name: "nature_id" })
    nature?: AccountLineNature | null;

    @Column({ type: "int", name: "nature_id", nullable: true })
    natureId?: number | null;

    @ManyToOne(() => AccountLinePoste, { nullable: true })
    @JoinColumn({ name: "poste_id" })
    poste?: AccountLinePoste | null;

    @Column({ type: "int", name: "poste_id", nullable: true })
    posteId?: number | null;

    @ManyToOne(() => Account, { nullable: false })
    @JoinColumn({ name: "account_id" })
    account: Account;

     @Column({ type: "int", name: "account_id", nullable: false })
    accountId: number;

    /**
     * Compte de l'opération miroir, pour un virement inter-comptes.
     * NULL ⟺ opération simple. Toujours cohérent avec {@link transferGroupId}
     * (les deux champs sont soit tous deux remplis, soit tous deux nuls).
     *
     * Traçabilité admin DB : pour retrouver la paire complète d'un virement,
     * utiliser `transfer_group_id` (2 lignes) ; `target_account_id` indique le
     * compte de l'autre ligne.
     */
    @ManyToOne(() => Account, { nullable: true })
    @JoinColumn({ name: "target_account_id" })
    targetAccount?: Account | null;

    /**
     * UUID liant les deux opérations miroir d'un virement inter-comptes
     * (la ligne de ce compte et la ligne de {@link targetAccount}).
     * Partagé par exactement 2 lignes : `SELECT * FROM account_line WHERE transfer_group_id = ...`.
     * NULL ⟺ opération simple. Toujours cohérent avec {@link targetAccount}.
     */
    @Column({ type: "varchar", length: 36, nullable: true, name: "transfer_group_id" })
    transferGroupId?: string | null;

    /* ========================
       MONTANTS (mouvement)
    ======================== */

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0, transformer: decimalNumberTransformer })
    debit: number;

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0, transformer: decimalNumberTransformer })
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