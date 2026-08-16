import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { AccountLinePoste } from "../../accounts/entities/AccountLinePoste";
import { AccountLineNature } from "../../accounts/entities/AccountLineNature";
import { Account } from "../../accounts/entities/Account";

@Entity('account_line_rule')
@Unique('UQ_account_line_rule_account_pattern', ['accountId', 'pattern'])
export class AccountLineRule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    label: string;

    @Column({ type: 'varchar', length: 255 })
    pattern: string;

    @Column({ type: 'int', default: 0 })
    occurrencesCount: number;

    /* ========================
       RELATIONS
    ======================== */

    @ManyToOne(() => AccountLinePoste, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'poste_id' })
    poste: AccountLinePoste;

    @Column({ type: 'int', name: 'poste_id', nullable: true })
    posteId: number | null;

    @ManyToOne(() => AccountLineNature, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'nature_id' })
    nature: AccountLineNature;

    @Column({ type: 'int', name: 'nature_id', nullable: true })
    natureId: number | null;

    @ManyToOne(() => Account, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @Column({ type: 'int', name: 'account_id', nullable: false })
    accountId: number | null;

}
