import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1731236615763 implements MigrationInterface {
    name = 'Default1731236615763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "poste" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comptes-chateau"."accounting-line" ALTER COLUMN "poste" SET NOT NULL`);
    }

}
