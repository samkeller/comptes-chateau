import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { KanbanTask } from "./KanbanTask";
import { User } from "../../core/entities/User";

@Entity("kanban_comment")
export class KanbanComment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "int" })
    taskId: number;

    @ManyToOne(() => KanbanTask, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "taskId" })
    task: KanbanTask;

    @Column({ type: "int" })
    authorId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "authorId" })
    author: User;

    @CreateDateColumn()
    createdAt: Date;
}
