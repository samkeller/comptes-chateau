import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDoneToKanbanTask1773506502535 implements MigrationInterface {
    name = 'AddIsDoneToKanbanTask1773506502535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task" ADD "isDone" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "kanban_task" ADD "doneByUserId" integer`);
        await queryRunner.query(`ALTER TABLE "kanban_task" ADD CONSTRAINT "FK_a0eb6338c6c75c1807ec07020cf" FOREIGN KEY ("doneByUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task" DROP CONSTRAINT "FK_a0eb6338c6c75c1807ec07020cf"`);
        await queryRunner.query(`ALTER TABLE "kanban_task" DROP COLUMN "doneByUserId"`);
        await queryRunner.query(`ALTER TABLE "kanban_task" DROP COLUMN "isDone"`);
    }

}
