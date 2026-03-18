import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountRelations1773827703273 implements MigrationInterface {
    name = 'AddAccountRelations1773827703273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "label" character varying(255)`);
        await queryRunner.query(`UPDATE "account" SET "label" = 'Compte courant' WHERE "id" = 1`);
        await queryRunner.query(`ALTER TABLE "account" ALTER COLUMN "label" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD "account_id" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "budget_item" ADD "account_id" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "account_line_nature" ADD "account_id" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD "account_id" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD CONSTRAINT "FK_68f16b3289553ef14cb7a253232" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budget_item" ADD CONSTRAINT "FK_155971a525621c39d751a2bb112" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_line_nature" ADD CONSTRAINT "FK_4cc1da6a1824119d33cbfb65553" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_59e68bd250f88f7462925708772" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_line" ALTER COLUMN "account_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "budget_item" ALTER COLUMN "account_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "account_line_nature" ALTER COLUMN "account_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "account_id" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_59e68bd250f88f7462925708772"`);
        await queryRunner.query(`ALTER TABLE "account_line_nature" DROP CONSTRAINT "FK_4cc1da6a1824119d33cbfb65553"`);
        await queryRunner.query(`ALTER TABLE "budget_item" DROP CONSTRAINT "FK_155971a525621c39d751a2bb112"`);
        await queryRunner.query(`ALTER TABLE "account_line" DROP CONSTRAINT "FK_68f16b3289553ef14cb7a253232"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "account_line_nature" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "label"`);
        await queryRunner.query(`ALTER TABLE "budget_item" DROP COLUMN "account_id"`);
        await queryRunner.query(`ALTER TABLE "account_line" DROP COLUMN "account_id"`);
    }

}
