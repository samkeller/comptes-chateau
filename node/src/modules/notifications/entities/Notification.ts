import type { NotificationSeverity, NotificationTarget } from "@chocosous/shared";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../core/entities/User";

/**
 * Notification événementielle persistée (ex. « une tâche vous a été assignée »).
 * Le contenu est figé à la publication : ajouter un type ne demande aucune déclaration.
 */
@Entity("notification")
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 64 })
    type: string;

    @Column({ type: "varchar", length: 16 })
    severity: NotificationSeverity;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "text" })
    message: string;

    @Column({ type: "simple-json", nullable: true })
    target: NotificationTarget | null;

    /** Destinataire ; `null` = tous les utilisateurs. */
    @Index()
    @Column({ type: "int", nullable: true })
    recipientUserId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "recipientUserId" })
    recipient: User | null;

    /** Auteur de l'action : il n'est pas notifié de ses propres actions. */
    @Column({ type: "int", nullable: true })
    actorUserId: number | null;

    @Index()
    @CreateDateColumn()
    createdAt: Date;
}
