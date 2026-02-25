import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { AccountLineNature } from "./AccountLineNature";
import { AccountLinePoste } from "./AccountLinePoste";

export enum AccountingLineSource {
    SYSTEM = 'system'
}

@Entity('accounting-line')
export class AccountingLine {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "date" })
    dateOperation: Date

    @Column({ type: "date", nullable: true })
    dateValeur: Date

    @Column({ type: 'text' })
    operation: string;

    @ManyToOne(() => AccountLineNature)
    @JoinColumn({ name: 'nature_id' })
    nature: AccountLineNature;

    @ManyToOne(() => AccountLinePoste)
    @JoinColumn({ name: 'poste_id' })
    poste: AccountLinePoste;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    solde: number

    @Column({ type: "boolean" })
    isHorsCB: boolean

    @Column({ type: "boolean", default: false })
    isChecked: boolean

    @Column({ type: "simple-enum", nullable: true, enum: AccountingLineSource })
    source?: AccountingLineSource
}