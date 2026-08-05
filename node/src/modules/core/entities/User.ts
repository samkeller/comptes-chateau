import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { KanbanTask } from "../../kanban/entities/KanbanTask";

@Entity("user")
@Unique(["username"])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  username: string;

  @Column({ type: "varchar", length: 255, default: "001-tiger.png" })
  avatar: string;

  @Column({ type: "int", default: 0 })
  totalXp: number;

  @Column({ type: "varchar", length: 255, select: false })
  passwordHash: string;

  @ManyToMany(() => KanbanTask, task => task.assignees)
  kanbanAssignedTasks: KanbanTask[];

}
