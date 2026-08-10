import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountlineRules1785833248769 implements MigrationInterface {
    name = 'AddAccountlineRules1785833248769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "account_line_rule" ("id" SERIAL NOT NULL, "pattern" character varying(255) NOT NULL, "occurrencesCount" integer NOT NULL DEFAULT '0', "poste_id" integer, "nature_id" integer, "account_id" integer NOT NULL, CONSTRAINT "UQ_account_line_rule_pattern" UNIQUE ("pattern"), CONSTRAINT "PK_82ff433faedc19ebc5e3e6b6ac5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" ADD CONSTRAINT "FK_0e31ca68de1a2367cae1a0ffad5" FOREIGN KEY ("poste_id") REFERENCES "account_line_poste"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" ADD CONSTRAINT "FK_03874cf798bc677543b3a05039b" FOREIGN KEY ("nature_id") REFERENCES "account_line_nature"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" ADD CONSTRAINT "FK_32ec0addd4ee68154243320b1a1" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_rule" DROP CONSTRAINT "FK_32ec0addd4ee68154243320b1a1"`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" DROP CONSTRAINT "FK_03874cf798bc677543b3a05039b"`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" DROP CONSTRAINT "FK_0e31ca68de1a2367cae1a0ffad5"`);
        await queryRunner.query(`DROP TABLE "account_line_rule"`);
    }

}
