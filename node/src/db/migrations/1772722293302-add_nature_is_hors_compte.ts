import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNatureIsHorsCompte1772722293302 implements MigrationInterface {
    name = 'AddNatureIsHorsCompte1772722293302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_nature" ADD "isHorsCompte" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_nature" DROP COLUMN "isHorsCompte"`);
    }

}
