import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";
import type { NoteType } from "@chocosous/shared";
import { User } from "../../core/entities/User";
import { NoteItem } from "./NoteItem";

@Entity("note")
@Index(["isArchived", "isPinned", "updatedAt"])
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    title: string;

    @Column({ type: "varchar", length: 16 })
    type: NoteType;

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

    @OneToMany(() => NoteItem, (item) => item.note, { cascade: ["remove"] })
    items: Relation<NoteItem>[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
