import { MigrationInterface, QueryRunner } from "typeorm";

export class DropNotNullRecurring1772524955946 implements MigrationInterface {
    name = 'DropNotNullRecurring1772524955946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "nextOccurrence" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "nextOccurrence" DROP NOT NULL`);
    }

}
