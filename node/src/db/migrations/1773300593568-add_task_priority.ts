import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskPriority1773300593568 implements MigrationInterface {
    name = 'AddTaskPriority1773300593568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."kanban_task_priority_enum" AS ENUM('low', 'normal', 'high')`);
        await queryRunner.query(`ALTER TABLE "kanban_task" ADD "priority" "comptes_chateau"."kanban_task_priority_enum" NOT NULL DEFAULT 'normal'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task" DROP COLUMN "priority"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."kanban_task_priority_enum"`);
    }

}
