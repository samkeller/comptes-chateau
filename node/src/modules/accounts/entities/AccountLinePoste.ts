import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('account_line_poste')
export class AccountLinePoste {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    label: string;

    @Column({ type: 'varchar', length: 7 })
    color: string;
}
