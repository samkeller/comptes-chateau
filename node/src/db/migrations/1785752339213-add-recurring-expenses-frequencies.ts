import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringExpensesFrequencies1785752339213 implements MigrationInterface {
    name = 'AddRecurringExpensesFrequencies1785752339213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."recurring_expense_frequency_enum" RENAME TO "recurring_expense_frequency_enum_old"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."recurring_expense_frequency_enum" AS ENUM('weekly', 'yearly', 'monthly', 'quarterly')`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "frequency" TYPE "comptes_chateau"."recurring_expense_frequency_enum" USING "frequency"::"text"::"comptes_chateau"."recurring_expense_frequency_enum"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "frequency" SET DEFAULT 'monthly'`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."recurring_expense_frequency_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."recurring_expense_frequency_enum_old" AS ENUM('yearly', 'monthly', 'quarterly')`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "frequency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "frequency" TYPE "comptes_chateau"."recurring_expense_frequency_enum_old" USING "frequency"::"text"::"comptes_chateau"."recurring_expense_frequency_enum_old"`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "frequency" SET DEFAULT 'monthly'`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."recurring_expense_frequency_enum"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."recurring_expense_frequency_enum_old" RENAME TO "recurring_expense_frequency_enum"`);
    }

}
