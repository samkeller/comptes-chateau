import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1731235205203 implements MigrationInterface {
    name = 'Default1731235205203'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ADD "dateValeur" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ADD "dateOperation" date`);
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ADD "isHorsCB" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" DROP COLUMN "isHorsCB"`);
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" DROP COLUMN "dateOperation"`);
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" DROP COLUMN "dateValeur"`);
    }

}
