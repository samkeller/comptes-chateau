import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import type { UserXpActionsPointsKeys } from "@chocosous/shared";
import { USER_XP_ACTIONS } from "@chocosous/shared";

@Entity("user_xp_log")
export class UserXpLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "enum", enum: Object.keys(USER_XP_ACTIONS) })
  action: UserXpActionsPointsKeys;

  @Column({ type: "int", name: "action_xp" })
  actionXp: number;

  @Column({ type: "int" })
  multiplicator: number;

  @Column({ type: "int" })
  userId: number;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
