import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";
import { Account } from "../../accounts/entities/Account";
import { AccountLineNature } from "../../accounts/entities/AccountLineNature";
import { User } from "../../core/entities/User";
import { testDataSource } from "../../../tests/testDbSetup";

let app: express.Express;
let seededUserId: number;
let seededNature: AccountLineNature;
let seededNatureAlt: AccountLineNature;

async function seedBaseData(): Promise<void> {
    const accountRepo = testDataSource.getRepository(Account);
    const natureRepo = testDataSource.getRepository(AccountLineNature);
    const userRepo = testDataSource.getRepository(User);

    await accountRepo.save({
        id: 1,
        label: "Compte principal",
        baseLineAmount: 0,
        baseLineEffectiveDate: new Date("2026-01-01"),
    });

    seededNature = await natureRepo.save({
        label: "Charges",
        color: "#112233",
        isHorsCompte: false,
    });

    seededNatureAlt = await natureRepo.save({
        label: "Loisirs",
        color: "#445566",
        isHorsCompte: false,
    });

    const seededUser = await userRepo.save({
        username: "dojo-user",
        avatar: "001-tiger.png",
        totalXp: 100,
        passwordHash: "hash",
    });
    seededUserId = seededUser.id;
}

describe("AccountLineCategorizationController integration", () => {
    beforeEach(async () => {
        await seedBaseData();

        const { default: accountLineCategorizationRoutes } = await import("./AccountLineCategorizationController");

        app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            (req as any).session = { userId: seededUserId };
            next();
        });
        app.use("/categorization", accountLineCategorizationRoutes);
        app.use(errorMiddleware);
    });

    it("increments user XP by 10 when a rule is created", async () => {
        const response = await request(app)
            .post("/categorization")
            .send({
                label: "Netflix FR",
                accountId: 1,
                natureId: seededNature.id,
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            label: "Netflix fr",
            pattern: "netflix fr",
            accountId: 1,
            natureId: seededNature.id,
        });

        const updatedUser = await testDataSource.getRepository(User).findOneByOrFail({ id: seededUserId });
        expect(updatedUser.totalXp).toBe(110);
    });

    it("returns hydrated relations after updating a rule", async () => {
        const createdResponse = await request(app)
            .post("/categorization")
            .send({
                label: "Abonnement sport",
                accountId: 1,
                natureId: seededNature.id,
            });

        expect(createdResponse.status).toBe(201);

        const updateResponse = await request(app)
            .put(`/categorization/${createdResponse.body.id}`)
            .send({
                label: "Abonnement sport",
                accountId: 1,
                natureId: seededNatureAlt.id,
            });

        expect(updateResponse.status).toBe(201);
        expect(updateResponse.body.natureId).toBe(seededNatureAlt.id);
        expect(updateResponse.body.nature).toMatchObject({
            id: seededNatureAlt.id,
            label: "Loisirs",
            color: "#445566",
        });
    });
});
