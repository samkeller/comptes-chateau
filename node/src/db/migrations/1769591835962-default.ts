import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1769591835962 implements MigrationInterface {
    name = 'Default1769591835962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account-line-nature" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "color" character varying(7) NOT NULL, CONSTRAINT "UQ_fcf4f16101b99fa06618011fa33" UNIQUE ("label"), CONSTRAINT "PK_b90078044ecaead08d469a8cf32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account-line-poste" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "color" character varying(7) NOT NULL, CONSTRAINT "UQ_a0fa810bff6bea69a76e33c1e39" UNIQUE ("label"), CONSTRAINT "PK_681c0d8e0576a7a6e4c0c24323e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accounting-line" ("id" SERIAL NOT NULL, "dateOperation" date NOT NULL, "dateValeur" date, "operation" text NOT NULL, "solde" integer NOT NULL, "isHorsCB" boolean NOT NULL, "nature_id" integer, "poste_id" integer, CONSTRAINT "PK_0b29b98a4d9e25662a103339ea0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "accounting-line" ADD CONSTRAINT "FK_31ca3e361d04b54555846cac07a" FOREIGN KEY ("nature_id") REFERENCES "account-line-nature"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounting-line" ADD CONSTRAINT "FK_7c7af066110cee7e2c9627fe04a" FOREIGN KEY ("poste_id") REFERENCES "account-line-poste"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounting-line" DROP CONSTRAINT "FK_7c7af066110cee7e2c9627fe04a"`);
        await queryRunner.query(`ALTER TABLE "accounting-line" DROP CONSTRAINT "FK_31ca3e361d04b54555846cac07a"`);
        await queryRunner.query(`DROP TABLE "accounting-line"`);
        await queryRunner.query(`DROP TABLE "account-line-poste"`);
        await queryRunner.query(`DROP TABLE "account-line-nature"`);
    }

}
