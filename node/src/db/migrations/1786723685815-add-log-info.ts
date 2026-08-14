import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLogInfo1786723685815 implements MigrationInterface {
    name = 'AddLogInfo1786723685815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."job_execution_log_status_enum" RENAME TO "job_execution_log_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."job_execution_log_status_enum" AS ENUM('success', 'error', 'warning', 'info')`);
        await queryRunner.query(`ALTER TABLE "job_execution_log" ALTER COLUMN "status" TYPE "comptes_chateau"."job_execution_log_status_enum" USING "status"::"text"::"comptes_chateau"."job_execution_log_status_enum"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."job_execution_log_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."job_execution_log_status_enum_old" AS ENUM('success', 'error', 'warning')`);
        await queryRunner.query(`ALTER TABLE "job_execution_log" ALTER COLUMN "status" TYPE "comptes_chateau"."job_execution_log_status_enum_old" USING "status"::"text"::"comptes_chateau"."job_execution_log_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."job_execution_log_status_enum"`);
        await queryRunner.query(`ALTER TYPE "comptes_chateau"."job_execution_log_status_enum_old" RENAME TO "job_execution_log_status_enum"`);
    }

}
