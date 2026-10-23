import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../../core/entities/User";

@Entity("note")
@Index(["isArchived", "isPinned", "updatedAt"])
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "text", nullable: true })
    content: string | null;

    @Column({ type: "boolean", default: false })
    isPinned: boolean;

    @Column({ type: "boolean", default: false })
    isArchived: boolean;

    @Column({ type: "timestamp", nullable: true })
    archivedAt: Date | null;

    @Column({ type: "int" })
    authorId: number;

    @ManyToOne(() => User, { nullable: false, onDelete: "NO ACTION" })
    @JoinColumn({ name: "authorId" })
    author: Relation<User>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
