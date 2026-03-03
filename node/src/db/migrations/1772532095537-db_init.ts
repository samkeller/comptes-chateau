import { MigrationInterface, QueryRunner } from "typeorm";

export class DbInit1772532095537 implements MigrationInterface {
    name = 'DbInit1772532095537'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account_line_nature" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "color" character varying(7) NOT NULL, CONSTRAINT "UQ_c99eeaab407a3d51fe17f67fa93" UNIQUE ("label"), CONSTRAINT "PK_e88304fab24994ba1243aafe2de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account_line_poste" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "color" character varying(7) NOT NULL, CONSTRAINT "UQ_8ca51af84b8a444b105673e6907" UNIQUE ("label"), CONSTRAINT "PK_6825fcfe771c4d44e6e80324415" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."recurring_expense_frequency_enum" AS ENUM('monthly')`);
        await queryRunner.query(`CREATE TABLE "recurring_expense" ("id" SERIAL NOT NULL, "label" text NOT NULL, "solde" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "nextOccurrence" date NOT NULL DEFAULT ('now'::text)::date, "frequency" "comptes_chateau"."recurring_expense_frequency_enum" NOT NULL DEFAULT 'monthly', "nature_id" integer, "poste_id" integer, CONSTRAINT "PK_e10f09121d23af7e23a0028ba00" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."job_execution_log_status_enum" AS ENUM('success', 'error', 'warning')`);
        await queryRunner.query(`CREATE TABLE "job_execution_log" ("id" SERIAL NOT NULL, "jobName" character varying(255) NOT NULL, "status" "comptes_chateau"."job_execution_log_status_enum" NOT NULL, "message" text, "details" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fdd4ccc15f8773140fdcd67e3eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."account_line_source_enum" AS ENUM('system', 'manual', 'import')`);
        await queryRunner.query(`CREATE TABLE "account_line" ("id" SERIAL NOT NULL, "debit" numeric(15,2) NOT NULL DEFAULT '0', "credit" numeric(15,2) NOT NULL DEFAULT '0', "label" character varying(255) NOT NULL, "isChecked" boolean NOT NULL DEFAULT false, "source" "comptes_chateau"."account_line_source_enum" NOT NULL DEFAULT 'manual', "dateOperation" date NOT NULL, "dateValeur" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "nature_id" integer, "poste_id" integer, CONSTRAINT "CHK_f533e4cb8446b686293c8529a6" CHECK (NOT ("debit" > 0 AND "credit" > 0)), CONSTRAINT "CHK_4b6dbef9de5ea8892b73567c44" CHECK ("credit" >= 0), CONSTRAINT "CHK_190ed442bf23994d09abc7a944" CHECK ("debit" >= 0), CONSTRAINT "PK_91e9106d0dc5899d37b08e6454c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_60a46f450a0cd1d0dccf78cb1e5" FOREIGN KEY ("nature_id") REFERENCES "account_line_nature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_ba5530a8ba0a74a0873f7dbde18" FOREIGN KEY ("poste_id") REFERENCES "account_line_poste"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD CONSTRAINT "FK_e88304fab24994ba1243aafe2de" FOREIGN KEY ("nature_id") REFERENCES "account_line_nature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD CONSTRAINT "FK_6825fcfe771c4d44e6e80324415" FOREIGN KEY ("poste_id") REFERENCES "account_line_poste"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" DROP CONSTRAINT "FK_6825fcfe771c4d44e6e80324415"`);
        await queryRunner.query(`ALTER TABLE "account_line" DROP CONSTRAINT "FK_e88304fab24994ba1243aafe2de"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_ba5530a8ba0a74a0873f7dbde18"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_60a46f450a0cd1d0dccf78cb1e5"`);
        await queryRunner.query(`DROP TABLE "account_line"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."account_line_source_enum"`);
        await queryRunner.query(`DROP TABLE "job_execution_log"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."job_execution_log_status_enum"`);
        await queryRunner.query(`DROP TABLE "recurring_expense"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."recurring_expense_frequency_enum"`);
        await queryRunner.query(`DROP TABLE "account_line_poste"`);
        await queryRunner.query(`DROP TABLE "account_line_nature"`);
    }

}
