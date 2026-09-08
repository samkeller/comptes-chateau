import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanquepostaleOperation1788852428353 implements MigrationInterface {
    name = 'AddBanquepostaleOperation1788852428353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "banque_postale_operation_import" ("id" SERIAL NOT NULL, "accountId" integer NOT NULL, "metadata" text NOT NULL, "dateOperation" date NOT NULL, "label" character varying(255) NOT NULL, "amount" numeric(10,2) NOT NULL, "rowNumber" integer NOT NULL, "compositeExternalId" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_44085a5ee15b6977b3ecd2eda52" UNIQUE ("compositeExternalId"), CONSTRAINT "PK_86009a49aaf1ae8fdc4f690046e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" ADD CONSTRAINT "FK_3994066d2148fdafdd09bfd25f4" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" DROP CONSTRAINT "FK_3994066d2148fdafdd09bfd25f4"`);
        await queryRunner.query(`DROP TABLE "banque_postale_operation_import"`);
    }

}
