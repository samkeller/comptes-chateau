import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringExpense1770214681772 implements MigrationInterface {
    name = 'AddRecurringExpense1770214681772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "recurring_expense" ("id" SERIAL NOT NULL, "label" text NOT NULL, "solde" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "nature_id" integer, "poste_id" integer, CONSTRAINT "PK_e10f09121d23af7e23a0028ba00" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_60a46f450a0cd1d0dccf78cb1e5" FOREIGN KEY ("nature_id") REFERENCES "account-line-nature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ADD CONSTRAINT "FK_ba5530a8ba0a74a0873f7dbde18" FOREIGN KEY ("poste_id") REFERENCES "account-line-poste"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_ba5530a8ba0a74a0873f7dbde18"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" DROP CONSTRAINT "FK_60a46f450a0cd1d0dccf78cb1e5"`);
        await queryRunner.query(`DROP TABLE "recurring_expense"`);
    }

}
