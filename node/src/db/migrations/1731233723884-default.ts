import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1731233723884 implements MigrationInterface {
    name = 'Default1731233723884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comptes-chateau"."accounting-line" ("id" SERIAL NOT NULL, "operation" text NOT NULL, "nature" text NOT NULL, "poste" text NOT NULL, "solde" integer NOT NULL, CONSTRAINT "PK_0b29b98a4d9e25662a103339ea0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "comptes-chateau"."accounting-line"`);
    }

}
