import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountTable1773826589677 implements MigrationInterface {
    name = 'AddAccountTable1773826589677'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account" ("id" integer NOT NULL DEFAULT '1', "baseLineAmount" numeric(15,2) NOT NULL DEFAULT '0', "baseLineEffectiveDate" date NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`INSERT INTO "account" ("id", "baseLineAmount", "baseLineEffectiveDate") SELECT "id", "amount", "effectiveDate" FROM "account_balance_baseline"`);
        await queryRunner.query(`DROP TABLE "account_balance_baseline"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account_balance_baseline" ("id" integer NOT NULL DEFAULT '1', "amount" numeric(15,2) NOT NULL DEFAULT '0', "effectiveDate" date NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bace93e34e97722d2ba86c6b629" PRIMARY KEY ("id"))`);
        await queryRunner.query(`INSERT INTO "account_balance_baseline" ("id", "amount", "effectiveDate") SELECT "id", "baseLineAmount", "baseLineEffectiveDate" FROM "account"`);
        await queryRunner.query(`DROP TABLE "account"`);
    }

}
