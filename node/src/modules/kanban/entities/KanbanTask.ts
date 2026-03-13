import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { KanbanColumn } from "./KanbanColumn";
import { KANBAN_TASK_PRIORITIES, KanbanTaskPriority } from "../dto/KanbanTaskPriority";

@Entity("kanban_task")
export class KanbanTask {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "text", array: true, default: () => "'{}'" })
    tags: string[];

    @Column({
        type: "enum",
        enum: KANBAN_TASK_PRIORITIES,
        default: "normal",
    })
    priority: KanbanTaskPriority;

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