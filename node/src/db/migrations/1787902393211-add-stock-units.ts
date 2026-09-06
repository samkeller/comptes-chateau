import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockUnits1787902393211 implements MigrationInterface {
    name = 'AddStockUnits1787902393211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE TABLE "stock_item" CASCADE`);
        await queryRunner.query(`TRUNCATE TABLE "stock_movement" CASCADE`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP CONSTRAINT "FK_79569e763910987b7685d69244d"`);
        await queryRunner.query(`CREATE TABLE "stock_unit" ("id" SERIAL NOT NULL, "itemId" integer NOT NULL, "locationId" integer NOT NULL, "quantity" double precision NOT NULL, "unit" character varying(64) NOT NULL, "expirationDate" date, "label" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_0621388b9d4fcd587d394279cad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "currentQuantity"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "locationId"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "expirationDate"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "unit"`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "defaultUnit" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "unitId" integer`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "fromLocationId" integer`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "toLocationId" integer`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."stock_movement_type_enum" RENAME TO "stock_movement_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum" AS ENUM('IN', 'OUT')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "comptes_chateau"."stock_movement_type_enum" USING "type"::"text"::"comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "stock_unit" ADD CONSTRAINT "FK_49d2a96ed3a5346041bf60eaf4d" FOREIGN KEY ("itemId") REFERENCES "stock_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_unit" ADD CONSTRAINT "FK_9f2e13afc3bcf1a6354e66c3108" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_7a48bd606db7f6d400a15b3ec65" FOREIGN KEY ("unitId") REFERENCES "stock_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_738d9f38dba0bf83892ab2c3fc6" FOREIGN KEY ("fromLocationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_11f599c24c4e5109807b9a7ab72" FOREIGN KEY ("toLocationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE TABLE "stock_movement", "stock_unit", "stock_item" RESTART IDENTITY CASCADE`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_11f599c24c4e5109807b9a7ab72"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_738d9f38dba0bf83892ab2c3fc6"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_7a48bd606db7f6d400a15b3ec65"`);
        await queryRunner.query(`ALTER TABLE "stock_unit" DROP CONSTRAINT "FK_9f2e13afc3bcf1a6354e66c3108"`);
        await queryRunner.query(`ALTER TABLE "stock_unit" DROP CONSTRAINT "FK_49d2a96ed3a5346041bf60eaf4d"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum_old" AS ENUM('IN', 'OUT')`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ALTER COLUMN "type" TYPE "comptes_chateau"."stock_movement_type_enum_old" USING "type"::"text"::"comptes_chateau"."stock_movement_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."stock_movement_type_enum_old" RENAME TO "stock_movement_type_enum"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "toLocationId"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "fromLocationId"`);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP COLUMN "unitId"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "defaultUnit"`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "unit" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "expirationDate" date`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "locationId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "currentQuantity" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP TABLE "stock_unit"`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD CONSTRAINT "FK_79569e763910987b7685d69244d" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
