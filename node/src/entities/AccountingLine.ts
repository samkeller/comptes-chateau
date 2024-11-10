import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('accounting-line')
export class Room {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'text' })
    operation: string;

    @Column({ type: 'text' })
    nature: string;

    @Column({ type: 'text' })
    poste: string

    @Column({ type: "int" })
    solde: number
}