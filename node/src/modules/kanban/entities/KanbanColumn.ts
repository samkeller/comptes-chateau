import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { KanbanTask } from "./KanbanTask";

@Entity("kanban_column")
@Unique(["order"])
export class KanbanColumn {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "int", unique: true })
    order: number;

    @OneToMany(() => KanbanTask, task => task.column)
    kanbanTasks: KanbanTask[];
}