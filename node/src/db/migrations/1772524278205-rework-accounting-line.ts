import { MigrationInterface, QueryRunner } from "typeorm";

export class ReworkAccountingLine1772524278205 implements MigrationInterface {
    name = 'ReworkAccountingLine1772524278205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."accounting_line_source_enum" AS ENUM('system', 'manual')`);
        await queryRunner.query(`CREATE TABLE "accounting_line" ("id" SERIAL NOT NULL, "debit" numeric(15,2) NOT NULL DEFAULT '0', "credit" numeric(15,2) NOT NULL DEFAULT '0', "label" character varying(255) NOT NULL, "source" "comptes_chateau"."accounting_line_source_enum" NOT NULL DEFAULT 'manual', "dateOperation" date NOT NULL, "dateValeur" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "nature_id" integer, "poste_id" integer, CONSTRAINT "CHK_addb1b0a68b98323c92d0554ba" CHECK (NOT ("debit" > 0 AND "credit" > 0)), CONSTRAINT "CHK_dafe45f2ce9d1ae3d29e98a05f" CHECK ("credit" >= 0), CONSTRAINT "CHK_7d85ae6d7d42251b2b81c33bc1" CHECK ("debit" >= 0), CONSTRAINT "PK_b9cae251175813e054039473aee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "nextOccurrence" SET DEFAULT ('now'::text)::date`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ADD CONSTRAINT "FK_36f09e81b03ec11b36bbdec2e62" FOREIGN KEY ("nature_id") REFERENCES "account_line_nature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ADD CONSTRAINT "FK_dde56ad359a0b5aa962609a1425" FOREIGN KEY ("poste_id") REFERENCES "account_line_poste"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounting_line" DROP CONSTRAINT "FK_dde56ad359a0b5aa962609a1425"`);
        await queryRunner.query(`ALTER TABLE "accounting_line" DROP CONSTRAINT "FK_36f09e81b03ec11b36bbdec2e62"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "nextOccurrence" SET DEFAULT CURRENT_DATE`);
        await queryRunner.query(`DROP TABLE "accounting_line"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."accounting_line_source_enum"`);
    }

}
