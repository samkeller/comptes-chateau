import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStockMovementModel1788207045827 implements MigrationInterface {
    name = 'UpdateStockMovementModel1788207045827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE TABLE "stock_movement"`); // Obligé de vider - tout change trop.
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_366b66f18bce7592b631347796a"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_7a48bd606db7f6d400a15b3ec65"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_738d9f38dba0bf83892ab2c3fc6"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_11f599c24c4e5109807b9a7ab72"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "occurredAt"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "fromLocationId"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "toLocationId"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "itemLabel" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "unit" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "locationId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "locationLabel" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "unitId" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."stock_movement_type_enum" RENAME TO "stock_movement_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum" AS ENUM('IN', 'OUT', 'DELETE')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "comptes_chateau"."stock_movement_type_enum" USING "type"::"text"::"comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE TABLE "stock_movement"`); // Obligé de vider - tout change trop.
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum_old" AS ENUM('IN', 'OUT')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "comptes_chateau"."stock_movement_type_enum_old" USING "type"::"text"::"comptes_chateau"."stock_movement_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."stock_movement_type_enum_old" RENAME TO "stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "unitId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "locationLabel"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "locationId"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "unit"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "itemLabel"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "source" character varying(50) NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "toLocationId" integer`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "fromLocationId" integer`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "occurredAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_11f599c24c4e5109807b9a7ab72" FOREIGN KEY ("toLocationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_738d9f38dba0bf83892ab2c3fc6" FOREIGN KEY ("fromLocationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_7a48bd606db7f6d400a15b3ec65" FOREIGN KEY ("unitId") REFERENCES "stock_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_366b66f18bce7592b631347796a" FOREIGN KEY ("itemId") REFERENCES "stock_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
