import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAvatar1773425329724 implements MigrationInterface {
    name = 'AddUserAvatar1773425329724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "avatar" character varying(255) NOT NULL DEFAULT '001-tiger.png'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatar"`);
    }

}
