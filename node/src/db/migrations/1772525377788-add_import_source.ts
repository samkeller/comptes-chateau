import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImportSource1772525377788 implements MigrationInterface {
    name = 'AddImportSource1772525377788'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."accounting_line_source_enum" RENAME TO "accounting_line_source_enum_old"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."accounting_line_source_enum" AS ENUM('system', 'manual', 'import')`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ALTER COLUMN "source" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ALTER COLUMN "source" TYPE "comptes_chateau"."accounting_line_source_enum" USING "source"::"text"::"comptes_chateau"."accounting_line_source_enum"`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ALTER COLUMN "source" SET DEFAULT 'manual'`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."accounting_line_source_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."accounting_line_source_enum_old" AS ENUM('system', 'manual')`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ALTER COLUMN "source" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ALTER COLUMN "source" TYPE "comptes_chateau"."accounting_line_source_enum_old" USING "source"::"text"::"comptes_chateau"."accounting_line_source_enum_old"`);
        await queryRunner.query(`ALTER TABLE "accounting_line" ALTER COLUMN "source" SET DEFAULT 'manual'`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."accounting_line_source_enum"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."accounting_line_source_enum_old" RENAME TO "accounting_line_source_enum"`);
    }

}
