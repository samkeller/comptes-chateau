import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKanbanComments1773508160570 implements MigrationInterface {
    name = 'AddKanbanComments1773508160570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "kanban_comment" ("id" SERIAL NOT NULL, "content" text NOT NULL, "taskId" integer NOT NULL, "authorId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_75991e10c521bd3af2de1053d1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "kanban_comment" ADD CONSTRAINT "FK_21404beecbef4679de828f7ebfb" FOREIGN KEY ("taskId") REFERENCES "kanban_task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kanban_comment" ADD CONSTRAINT "FK_b55a3c44b5d6c1824a37a3a25bb" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_comment" DROP CONSTRAINT "FK_b55a3c44b5d6c1824a37a3a25bb"`);
        await queryRunner.query(`ALTER TABLE "kanban_comment" DROP CONSTRAINT "FK_21404beecbef4679de828f7ebfb"`);
        await queryRunner.query(`DROP TABLE "kanban_comment"`);
    }

}
