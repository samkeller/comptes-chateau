import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNoteTypeColumn1792586607925 implements MigrationInterface {
    name = 'RemoveNoteTypeColumn1792586607925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."note_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."note_type_enum" AS ENUM('text', 'checklist')`);
        await queryRunner.query(`ALTER TABLE "note" ADD "type" "comptes_chateau"."note_type_enum" NOT NULL`);
    }

}
