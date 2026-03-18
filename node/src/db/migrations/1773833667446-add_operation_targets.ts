import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOperationTargets1773833667446 implements MigrationInterface {
    name = 'AddOperationTargets1773833667446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" ADD "transfer_group_id" character varying(36)`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD "target_account_id" integer`);
        await queryRunner.query(`ALTER TABLE "account_line" ADD CONSTRAINT "FK_2ffc90889be5360ae155c3bf4bd" FOREIGN KEY ("target_account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" DROP CONSTRAINT "FK_2ffc90889be5360ae155c3bf4bd"`);
        await queryRunner.query(`ALTER TABLE "account_line" DROP COLUMN "target_account_id"`);
        await queryRunner.query(`ALTER TABLE "account_line" DROP COLUMN "transfer_group_id"`);
    }

}
