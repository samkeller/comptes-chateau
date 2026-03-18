import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

@Entity('account_line_nature')
export class AccountLineNature {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    label: string;

    @Column({ type: 'varchar', length: 7 })
    color: string;

    @Column({ type: 'bool', default: false })
    isHorsCompte: boolean

    /* ========================
       RELATIONS
    ======================== */
    @ManyToOne(() => Account, { nullable: false })
    @JoinColumn({ name: "account_id" })
    account: Account;
}
