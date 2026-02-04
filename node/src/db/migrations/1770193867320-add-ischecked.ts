import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIschecked1770193867320 implements MigrationInterface {
    name = 'AddIschecked1770193867320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounting-line" ADD "isChecked" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounting-line" DROP COLUMN "isChecked"`);
    }

}
