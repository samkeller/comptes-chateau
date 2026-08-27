import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockModule1787603121851 implements MigrationInterface {
    name = 'AddStockModule1787603121851'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_location" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_adf770067d0df1421f525fa25cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stock_item" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "barcode" character varying(64), "currentQuantity" double precision NOT NULL DEFAULT '0', "unit" character varying(64) NOT NULL, "locationId" integer NOT NULL, "expirationDate" date, "imageUrl" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_0b51047279d22d97442d46dfee8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."stock_movement_type_enum" AS ENUM('IN', 'OUT')`);
        await queryRunner.query(`CREATE TABLE "stock_movement" ("id" SERIAL NOT NULL, "itemId" integer NOT NULL, "type" "comptes_chateau"."stock_movement_type_enum" NOT NULL, "quantity" double precision NOT NULL, "occurredAt" TIMESTAMP NOT NULL, "source" character varying(50) NOT NULL DEFAULT 'manual', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9fe1232f916686ae8cf00294749" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD CONSTRAINT "FK_79569e763910987b7685d69244d" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_366b66f18bce7592b631347796a" FOREIGN KEY ("itemId") REFERENCES "stock_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_366b66f18bce7592b631347796a"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP CONSTRAINT "FK_79569e763910987b7685d69244d"`);
        await queryRunner.query(`DROP TABLE "stock_movement"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."stock_movement_type_enum"`);
        await queryRunner.query(`DROP TABLE "stock_item"`);
        await queryRunner.query(`DROP TABLE "stock_location"`);
    }

}
