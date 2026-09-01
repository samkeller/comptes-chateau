import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { KanbanColumn } from "./KanbanColumn";
import { KANBAN_TASK_PRIORITIES, type KanbanTaskPriority } from "@chocosous/shared";
import { User } from "../../core/entities/User";

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

    @ManyToMany(() => User, { nullable: true })
    @JoinTable({
        name: "kanban_task_assignee",
        joinColumn: {
            name: "taskId",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "userId",
            referencedColumnName: "id",
        },
    })
    assignees: User[];

    @Column({ type: "boolean", default: false })
    isDone: boolean;

    @Column({ type: "int", nullable: true })
    doneByUserId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "doneByUserId" })
    doneBy: User | null;

    @CreateDateColumn()
    createdAt: Date;
}