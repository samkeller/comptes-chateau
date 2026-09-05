import { MigrationInterface, QueryRunner } from "typeorm";

export class RmStockunitLabel1788118064523 implements MigrationInterface {
    name = 'RmStockunitLabel1788118064523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_unit" DROP COLUMN "label"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."stock_movement_type_enum" RENAME TO "stock_movement_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum" AS ENUM('IN', 'OUT')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "comptes_chateau"."stock_movement_type_enum" USING "type"::"text"::"comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum_old" AS ENUM('IN', 'OUT', 'MOVE', 'ADJUST', 'DISCARD')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "comptes_chateau"."stock_movement_type_enum_old" USING "type"::"text"::"comptes_chateau"."stock_movement_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."stock_movement_type_enum_old" RENAME TO "stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TABLE "stock_unit" ADD "label" character varying(255)`);
    }

}
