import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
} from "typeorm";
import { Note } from "./Note";

@Entity("note_item")
@Index(["noteId", "sortOrder"])
export class NoteItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    noteId: number;

    @ManyToOne(() => Note, (note) => note.items, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "noteId" })
    note: Relation<Note>;

    @Column({ type: "varchar", length: 500 })
    label: string;

    @Column({ type: "boolean", default: false })
    isChecked: boolean;

    @Column({ type: "int", default: 0 })
    sortOrder: number;
}
