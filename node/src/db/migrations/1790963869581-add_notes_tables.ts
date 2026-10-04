import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesTables1790963869581 implements MigrationInterface {
    name = 'AddNotesTables1790963869581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" DROP CONSTRAINT "FK_banque_postale_operation_import_account_line_id"`);
        await queryRunner.query(`CREATE TABLE "note" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "type" character varying(16) NOT NULL, "content" text, "isPinned" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "archivedAt" TIMESTAMP, "authorId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22898da32b9b074a50f2a700c4" ON "note" ("isArchived", "isPinned", "updatedAt") `);
        await queryRunner.query(`CREATE TABLE "note_item" ("id" SERIAL NOT NULL, "noteId" integer NOT NULL, "label" character varying(500) NOT NULL, "isChecked" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_eeb5901759f08fdf8e4447fa86c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ee3756f73693d098dd1fc11df8" ON "note_item" ("noteId", "sortOrder") `);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_59d5801d406020527940335d902" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_item" ADD CONSTRAINT "FK_e2baf1e6981ea46a49685a1cb69" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" ADD CONSTRAINT "FK_d02933abbee15cb85fa584dde06" FOREIGN KEY ("accountLineId") REFERENCES "account_line"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" DROP CONSTRAINT "FK_d02933abbee15cb85fa584dde06"`);
        await queryRunner.query(`ALTER TABLE "note_item" DROP CONSTRAINT "FK_e2baf1e6981ea46a49685a1cb69"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_59d5801d406020527940335d902"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_ee3756f73693d098dd1fc11df8"`);
        await queryRunner.query(`DROP TABLE "note_item"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_22898da32b9b074a50f2a700c4"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" ADD CONSTRAINT "FK_banque_postale_operation_import_account_line_id" FOREIGN KEY ("accountLineId") REFERENCES "account_line"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
