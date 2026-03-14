import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKanbanTaskAssignees1773422264941 implements MigrationInterface {
    name = 'AddKanbanTaskAssignees1773422264941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "kanban_task_assignee" ("taskId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_70c9f742d4333192ce760166750" PRIMARY KEY ("taskId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c3c180ed3532b26d887a24228b" ON "kanban_task_assignee" ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_22845a5b09dc28a0afecb27565" ON "kanban_task_assignee" ("userId") `);
        await queryRunner.query(`ALTER TABLE "kanban_task_assignee" ADD CONSTRAINT "FK_c3c180ed3532b26d887a24228b4" FOREIGN KEY ("taskId") REFERENCES "kanban_task"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "kanban_task_assignee" ADD CONSTRAINT "FK_22845a5b09dc28a0afecb275650" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task_assignee" DROP CONSTRAINT "FK_22845a5b09dc28a0afecb275650"`);
        await queryRunner.query(`ALTER TABLE "kanban_task_assignee" DROP CONSTRAINT "FK_c3c180ed3532b26d887a24228b4"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_22845a5b09dc28a0afecb27565"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_c3c180ed3532b26d887a24228b"`);
        await queryRunner.query(`DROP TABLE "kanban_task_assignee"`);
    }

}
