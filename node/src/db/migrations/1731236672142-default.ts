import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1731236672142 implements MigrationInterface {
    name = 'Default1731236672142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "dateOperation" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "dateValeur" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "dateValeur" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "dateOperation" DROP NOT NULL`);
    }

}
