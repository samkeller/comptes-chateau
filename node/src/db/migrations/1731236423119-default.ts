import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1731236423119 implements MigrationInterface {
    name = 'Default1731236423119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "nature" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "nature" SET NOT NULL`);
    }

}
