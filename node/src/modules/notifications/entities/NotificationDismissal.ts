import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "../../core/entities/User";

/** Notification ignorée par un utilisateur, identifiée par sa clé (événement ou état). */
@Entity("notification_dismissal")
@Unique(["userId", "key"])
export class NotificationDismissal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    userId: number;

    @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "varchar", length: 255 })
    key: string;

    @CreateDateColumn()
    createdAt: Date;
}
