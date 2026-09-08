import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Account } from "../../accounts/entities/Account";
import { BanquePostaleCsvDataMetadata } from "@chocosous/shared";

@Entity("banque_postale_operation_import")
export class BanquePostaleOperationImport {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Account)
    @JoinColumn({ name: "accountId" })
    account: Account;

    @Column({ type: "int" })
    accountId: number;

    /**
     * Utile pour stocker de manière un peut brutes les données d'import dont on ne sait pas quoi faire à date.
     * Permet toujours de garder un historique des imports.
     */
    @Column("simple-json")
    metadata: BanquePostaleCsvDataMetadata;

    @Column({ type: "date" })
    dateOperation: string;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "int" })
    rowNumber: number;

    @Column({ type: "varchar", length: 255, unique: true })
    compositeExternalId: string;

    @CreateDateColumn()
    createdAt: Date;
}