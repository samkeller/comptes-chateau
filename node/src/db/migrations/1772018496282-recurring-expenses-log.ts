import { MigrationInterface, QueryRunner } from "typeorm";

export class RecurringExpensesLog1772018496282 implements MigrationInterface {
    name = 'RecurringExpensesLog1772018496282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."job_execution_log_status_enum" AS ENUM('success', 'error', 'warning')`);
        await queryRunner.query(`CREATE TABLE "job_execution_log" ("id" SERIAL NOT NULL, "jobName" character varying(255) NOT NULL, "status" "comptes_chateau"."job_execution_log_status_enum" NOT NULL, "message" text, "details" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fdd4ccc15f8773140fdcd67e3eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD "nextOccurrence" date`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."recurring_expense_frequency_enum" AS ENUM('monthly')`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD "frequency" "comptes_chateau"."recurring_expense_frequency_enum" NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."account_line_source_enum" AS ENUM('system')`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD "source" "comptes_chateau"."account_line_source_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" DROP COLUMN "source"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."account_line_source_enum"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP COLUMN "frequency"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."recurring_expense_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP COLUMN "nextOccurrence"`);
        await queryRunner.query(`DROP TABLE "job_execution_log"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."job_execution_log_status_enum"`);
    }

}
