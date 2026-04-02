import express from "express";
import request from "supertest";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import SetupTestDb from "../../../tests/SetupTests";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";
import { Account } from "../entities/Account";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";

let testDataSource: DataSource;

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => testDataSource.getRepository(entity),
    }
}));

describe("BudgetController integration", () => {
    let app: express.Express;
    let accountId: number;
    let posteId: number;

    beforeAll(async () => {
        const db = SetupTestDb();

        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [Account, AccountLinePoste, BudgetItem],
            synchronize: true,
        });

        await testDataSource.initialize();

        const accountRepo = testDataSource.getRepository(Account);
        const posteRepo = testDataSource.getRepository(AccountLinePoste);

        const account = await accountRepo.save({
            id: 1,
            label: "Compte principal",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01"),
        });
        accountId = account.id;

        const poste = await posteRepo.save({
            label: "Logement",
            color: "#445566",
            account,
        });
        posteId = poste.id;

        const { default: budgetRoutes } = await import("./BudgetController");

        app = express();
        app.use(express.json());
        app.use("/accounts/:accountId/budget", budgetRoutes);
        app.use(errorMiddleware);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("creates, updates and reads an active budget item", async () => {
        const createResponse = await request(app)
            .post(`/accounts/${accountId}/budget`)
            .send({
                category: "incompressible",
                label: "Loyer",
                amount: 800,
                sortOrder: 1,
                posteId,
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toMatchObject({
            category: "incompressible",
            label: "Loyer",
            amount: 800,
            sortOrder: 1,
            poste: {
                id: posteId,
                label: "Logement",
                color: "#445566",
            },
        });

        const id = Number(createResponse.body.id);

        const updateResponse = await request(app)
            .put(`/accounts/${accountId}/budget/${id}`)
            .send({
                category: "incompressible",
                label: "Loyer principal",
                amount: 820,
                sortOrder: 2,
                posteId: null,
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toMatchObject({
            id,
            label: "Loyer principal",
            amount: 820,
            sortOrder: 2,
            poste: null,
        });

        const listResponse = await request(app).get(`/accounts/${accountId}/budget`);
        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toHaveLength(1);
        expect(listResponse.body[0]).toMatchObject({
            id,
            label: "Loyer principal",
            amount: 820,
            poste: null,
        });
    });

    it("soft deletes an item and excludes it from active list", async () => {
        const createResponse = await request(app)
            .post(`/accounts/${accountId}/budget`)
            .send({
                category: "compressible",
                label: "Loisirs",
                amount: 150,
                sortOrder: 3,
                posteId: null,
            });

        const id = Number(createResponse.body.id);

        const deleteResponse = await request(app).delete(`/accounts/${accountId}/budget/${id}`);
        expect(deleteResponse.status).toBe(204);

        const listResponse = await request(app).get(`/accounts/${accountId}/budget`);
        expect(listResponse.status).toBe(200);
        expect(listResponse.body.some((item: { id: number }) => item.id === id)).toBe(false);

        const repo = testDataSource.getRepository(BudgetItem);
        const deletedItem = await repo.findOneBy({ id });
        expect(deletedItem?.isActive).toBe(false);
    });

    it("returns 400 when poste does not belong to account", async () => {
        const accountRepo = testDataSource.getRepository(Account);
        const posteRepo = testDataSource.getRepository(AccountLinePoste);

        const otherAccount = await accountRepo.save({
            id: 2,
            label: "Compte secondaire",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01"),
        });

        const otherPoste = await posteRepo.save({
            label: "Autre",
            color: "#112233",
            account: otherAccount,
        });

        const response = await request(app)
            .post(`/accounts/${accountId}/budget`)
            .send({
                category: "epargne",
                label: "Objectif",
                amount: 100,
                sortOrder: 0,
                posteId: otherPoste.id,
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("BUDGET_POSTE_INVALID");
    });
});
