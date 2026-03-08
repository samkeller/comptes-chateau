import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("user")
@Unique(["username"])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  username: string;

  @Column({ type: "varchar", length: 255, select: false })
  passwordHash: string;

}
