import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('accounting-line')
export class Room {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "date" })
    dateOperation: Date

    @Column({ type: "date", nullable: true })
    dateValeur: Date

    @Column({ type: 'text' })
    operation: string;

    @Column({ type: 'text', nullable: true })
    nature: string;

    @Column({ type: 'text', nullable: true })
    poste: string

    @Column({ type: "int" })
    solde: number

    @Column({ type: "boolean" })
    isHorsCB: boolean
}