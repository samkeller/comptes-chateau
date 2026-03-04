import { MigrationInterface, QueryRunner } from "typeorm";

export class AjoutBaseline1772647887870 implements MigrationInterface {
    name = 'AjoutBaseline1772647887870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account_balance_baseline" ("id" integer NOT NULL DEFAULT '1', "amount" numeric(15,2) NOT NULL DEFAULT '0', "effectiveDate" date NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bace93e34e97722d2ba86c6b629" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "account_balance_baseline"`);
    }

}
