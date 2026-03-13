import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKanbanTaskTags1773396241317 implements MigrationInterface {
    name = 'AddKanbanTaskTags1773396241317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task" ADD "tags" text array NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task" DROP COLUMN "tags"`);
    }

}
