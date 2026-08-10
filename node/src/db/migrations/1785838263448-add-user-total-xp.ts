import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTotalXp1785838263448 implements MigrationInterface {
    name = 'AddUserTotalXp1785838263448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "totalXp" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "totalXp"`);
    }

}
