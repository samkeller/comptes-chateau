import { MigrationInterface, QueryRunner } from "typeorm";

export class KanbanTaskV01773073713836 implements MigrationInterface {
    name = 'KanbanTaskV01773073713836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "kanban_column" ("id" SERIAL NOT NULL, "label" character varying(255) NOT NULL, "order" integer NOT NULL, CONSTRAINT "UQ_e53561a6c62fb6edc4d01767044" UNIQUE ("order"), CONSTRAINT "UQ_e53561a6c62fb6edc4d01767044" UNIQUE ("order"), CONSTRAINT "PK_80b6037f8dc46fc67b81a7e307c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "kanban_task" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "columnId" integer NOT NULL, CONSTRAINT "PK_1348f29016a139f0463f7d5d6d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "kanban_task" ADD CONSTRAINT "FK_2545b817e1b30f785f8020ceb52" FOREIGN KEY ("columnId") REFERENCES "kanban_column"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kanban_task" DROP CONSTRAINT "FK_2545b817e1b30f785f8020ceb52"`);
        await queryRunner.query(`DROP TABLE "kanban_task"`);
        await queryRunner.query(`DROP TABLE "kanban_column"`);
    }

}
