import { MigrationInterface, QueryRunner } from "typeorm";

export class UnifyNotesMarkdown1792573541377 implements MigrationInterface {
    name = 'UnifyNotesMarkdown1792573541377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Convertir les note_item existants en markdown GFM dans note.content
        // Pour chaque note de type checklist, on concatène les items en syntaxe GFM
        const checklistNotes = await queryRunner.query(
            `SELECT n.id, n.content FROM "note" n WHERE n.type = 'checklist'`
        );

        for (const note of checklistNotes) {
            const items = await queryRunner.query(
                `SELECT label, "isChecked", "sortOrder" FROM "note_item" WHERE "noteId" = $1 ORDER BY "sortOrder", id`,
                [note.id]
            );

            if (items.length > 0) {
                const checklistMarkdown = items.map((item: { label: string; isChecked: boolean }) =>
                    `- [${item.isChecked ? "x" : " "}] ${item.label}`
                ).join("\n");

                // Fusionner avec le contenu existant : checklist puis contenu texte
                const newContent = note.content
                    ? `${checklistMarkdown}\n\n${note.content}`
                    : checklistMarkdown;

                await queryRunner.query(
                    `UPDATE "note" SET content = $1 WHERE id = $2`,
                    [newContent, note.id]
                );
            }
        }

        // Supprimer la table note_item
        await queryRunner.query(`DROP TABLE "note_item"`);

        // Les changements d'enum détectés par TypeORM
        await queryRunner.query(`ALTER TYPE "stock_movement_type_enum" RENAME TO "stock_movement_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "stock_movement_type_enum" AS ENUM('IN', 'OUT', 'DELETE')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "stock_movement_type_enum" USING "type"::"text"::"stock_movement_type_enum"`);
        await queryRunner.query(`DROP TYPE "stock_movement_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "note_type_enum" RENAME TO "note_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "note_type_enum" AS ENUM('text', 'checklist')`);
        await queryRunner.query(`ALTER TABLE "note" ALTER COLUMN "type" TYPE "note_type_enum" USING "type"::"text"::"note_type_enum"`);
        await queryRunner.query(`DROP TYPE "note_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurer les enums
        await queryRunner.query(`CREATE TYPE "note_type_enum_old" AS ENUM('text', 'checklist')`);
        await queryRunner.query(`ALTER TABLE "note" ALTER COLUMN "type" TYPE "note_type_enum_old" USING "type"::"text"::"note_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "note_type_enum"`);
        await queryRunner.query(`ALTER TYPE "note_type_enum_old" RENAME TO "note_type_enum"`);
        await queryRunner.query(`CREATE TYPE "stock_movement_type_enum_old" AS ENUM('IN', 'OUT', 'DELETE', 'ADJUST')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "stock_movement_type_enum_old" USING "type"::"text"::"stock_movement_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TYPE "stock_movement_type_enum_old" RENAME TO "stock_movement_type_enum"`);

        // Recréer la table note_item (sans données — la conversion inverse est complexe)
        await queryRunner.query(`
            CREATE TABLE "note_item" (
                "id" SERIAL NOT NULL,
                "label" character varying NOT NULL,
                "isChecked" boolean NOT NULL DEFAULT false,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "noteId" integer NOT NULL,
                CONSTRAINT "PK_note_item" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "note_item"
            ADD CONSTRAINT "FK_note_item_note" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
