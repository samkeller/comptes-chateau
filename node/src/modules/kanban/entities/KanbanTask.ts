import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { KanbanColumn } from "./KanbanColumn";

@Entity("kanban_task")
export class KanbanTask {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    /**
     * Nécessaire pour ne pas charger toute la relation.
     */
    @Column({ type: "int" })
    columnId: number;

    @ManyToOne(() => KanbanColumn, column => column.kanbanTasks, { nullable: false })
    column: KanbanColumn;

    @CreateDateColumn()
    createdAt: Date;
}