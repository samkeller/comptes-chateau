import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserXpLog1793610125452 implements MigrationInterface {
    name = 'AddUserXpLog1793610125452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "user_xp_log_action_enum" AS ENUM('ACCOUNT_LINE_RULE_CREATED', 'ACCOUNT_LINE_OPERATION_CREATED', 'ACCOUNT_LINE_OPERATION_VALIDATED', 'ACCOUNT_RECURRING_EXPENSE_CREATED', 'KANBAN_TASK_COMPLETED', 'KANBAN_TASK_CREATED', 'STOCK_ITEM_CREATED', 'STOCK_UNIT_CREATED', 'STOCK_UNIT_TAKE', 'BANQUE_POSTALE_OPERATION_IMPORTED', 'BANQUE_POSTALE_OPERATION_LINKED')`);
        await queryRunner.query(`CREATE TABLE "user_xp_log" ("id" SERIAL NOT NULL, "action" "user_xp_log_action_enum" NOT NULL, "action_xp" integer NOT NULL, "multiplicator" integer NOT NULL, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5dd811b6a094da7a177f8bf5c2a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_xp_log" ADD CONSTRAINT "FK_52a493d71add85d224aa30454be" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_xp_log" DROP CONSTRAINT "FK_52a493d71add85d224aa30454be"`);
        await queryRunner.query(`DROP TABLE "user_xp_log"`);
        await queryRunner.query(`DROP TYPE "user_xp_log_action_enum"`);
    }

}
