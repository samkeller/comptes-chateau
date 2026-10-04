import { MigrationInterface, QueryRunner } from "typeorm";

export class NotetypeSimpleEnum1791100449252 implements MigrationInterface {
    name = 'NotetypeSimpleEnum1791100449252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."note_type_enum" AS ENUM('text', 'checklist')`);
        await queryRunner.query(`ALTER TABLE "note" ADD "type" "comptes_chateau"."note_type_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."note_type_enum"`);
        await queryRunner.query(`ALTER TABLE "note" ADD "type" character varying(16) NOT NULL`);
    }

}
