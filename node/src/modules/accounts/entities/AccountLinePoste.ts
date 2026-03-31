import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Account } from "./Account";

@Entity('account_line_poste')
@Unique("UQ_account_line_poste_account_label", ["account", "label"])
export class AccountLinePoste {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    label: string;

    @Column({ type: 'varchar', length: 7 })
    color: string;

    /* ========================
       RELATIONS
    ======================== */
    @Column({ type: "int", name: "account_id", default: 1 })
    accountId: number;

    @ManyToOne(() => Account, { nullable: false })
    @JoinColumn({ name: "account_id" })
    account: Account;
}
