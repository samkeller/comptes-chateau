import express from "express";
import request from "supertest";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { IMemoryDb } from "pg-mem";
import SetupTestDb from "../../../tests/SetupTests";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";
import { Account } from "../../accounts/entities/Account";
import { AccountLine } from "../../accounts/entities/AccountLine";
import { AccountLineNature } from "../../accounts/entities/AccountLineNature";
import { AccountLinePoste } from "../../accounts/entities/AccountLinePoste";
import { AccountLineRule } from "../entities/AccountLineRule";
import { User } from "../../core/entities/User";

let testDataSource: DataSource;
let db: IMemoryDb;
let app: express.Express;
let seededUser: User;
let seededNature: AccountLineNature;
let seededNatureAlt: AccountLineNature;

const mockUserRepo = {
    findOne: vi.fn(async ({ where }: { where: { id: number } }) => {
        if (!seededUser || where.id !== seededUser.id) {
            return null;
        }

        return seededUser;
    }),
    increment: vi.fn(async ({ id }: { id: number }, field: string, value: number) => {
        if (seededUser && id === seededUser.id && field === "totalXp") {
            seededUser.totalXp += value;
        }
    }),
    save: vi.fn(async (user: User) => {
        if (seededUser && user.id === seededUser.id) {
            seededUser = { ...seededUser, ...user };
            return seededUser;
        }
    }),
};

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => {
            if (entity === User) {
                return mockUserRepo;
            }

            return testDataSource.getRepository(entity);
        },
    }
}));

async function seedBaseData(dataSource: DataSource): Promise<void> {
    const accountRepo = dataSource.getRepository(Account);
    const natureRepo = dataSource.getRepository(AccountLineNature);

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

    seededUser = {
        id: 11,
        username: "dojo-user",
        avatar: "001-tiger.png",
        totalXp: 100,
        passwordHash: "hash",
        kanbanAssignedTasks: [],
    } as User;
}

describe("AccountLineCategorizationController integration", () => {
    beforeAll(async () => {
        db = SetupTestDb();

        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [Account, AccountLine, AccountLineNature, AccountLinePoste, AccountLineRule],
            synchronize: true,
        });

        await testDataSource.initialize();
        await seedBaseData(testDataSource);

        const { default: accountLineCategorizationRoutes } = await import("./AccountLineCategorizationController");

        app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            (req as any).session = { userId: seededUser.id };
            next();
        });
        app.use("/categorization", accountLineCategorizationRoutes);
        app.use(errorMiddleware);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("increments user XP by 10 when a rule is created", async () => {
        const response = await request(app)
            .post("/categorization")
            .send({
                pattern: "Netflix FR",
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

        expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: seededUser.id } });
        expect(seededUser.totalXp).toBe(110);
    });

    it("returns hydrated relations after updating a rule", async () => {
        const createdResponse = await request(app)
            .post("/categorization")
            .send({
                pattern: "Abonnement sport",
                accountId: 1,
                natureId: seededNature.id,
            });

        expect(createdResponse.status).toBe(201);

        const updateResponse = await request(app)
            .put(`/categorization/${createdResponse.body.id}`)
            .send({
                pattern: "Abonnement sport",
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
