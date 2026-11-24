import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1795458910064 implements MigrationInterface {
    name = 'AddNotifications1795458910064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification_dismissal" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "key" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_41c79f851d77bb0c8a27ec19f6c" UNIQUE ("userId", "key"), CONSTRAINT "PK_3be9ccbedc60dc8fc005e361f2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "type" character varying(64) NOT NULL, "severity" character varying(16) NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "target" text, "recipientUserId" integer, "actorUserId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_419ebf820f56dbe6ac1a647f15" ON "notification" ("recipientUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b11a5e627c41d4dc3170f1d370" ON "notification" ("createdAt") `);
        await queryRunner.query(`ALTER TABLE "notification_dismissal" ADD CONSTRAINT "FK_53f60b3b1816d4c61f9a7fcdce8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_419ebf820f56dbe6ac1a647f15f" FOREIGN KEY ("recipientUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_419ebf820f56dbe6ac1a647f15f"`);
        await queryRunner.query(`ALTER TABLE "notification_dismissal" DROP CONSTRAINT "FK_53f60b3b1816d4c61f9a7fcdce8"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_b11a5e627c41d4dc3170f1d370"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_419ebf820f56dbe6ac1a647f15"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "notification_dismissal"`);
    }

}
