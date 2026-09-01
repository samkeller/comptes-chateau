import express from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDataSource } from "../../../tests/testDbSetup";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";
import { Account } from "../entities/Account";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { BudgetItem } from "../entities/BudgetItem";

describe("BudgetController integration", () => {
    let app: express.Express;
    let accountId: number;
    let posteId: number;

    beforeAll(async () => {
        const { default: budgetRoutes } = await import("./BudgetController");

        app = express();
        app.use(express.json());
        app.use("/accounts/:accountId/budget", budgetRoutes);
        app.use(errorMiddleware);
    });

    beforeEach(async () => {
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
    });

    it("creates, updates and reads an active budget item", async () => {
        const createResponse = await request(app)
            .post(`/accounts/${accountId}/budget`)
            .send({
                label: "Loyer",
                amount: 800,
                sortOrder: 1,
                posteId,
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toMatchObject({
            label: "Loyer",
            amount: 800,
            isActive: true,
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
            isActive: true,
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
            isActive: true,
            poste: null,
        });
    });

    it("updates activation state and keeps the line visible in budget editing list", async () => {
        const createResponse = await request(app)
            .post(`/accounts/${accountId}/budget`)
            .send({
                label: "Abonnement salle",
                amount: 45,
                sortOrder: 3,
                posteId: null,
            });

        const id = Number(createResponse.body.id);

        const updateResponse = await request(app)
            .put(`/accounts/${accountId}/budget/${id}`)
            .send({
                label: "Abonnement salle",
                amount: 45,
                isActive: false,
                sortOrder: 3,
                posteId: null,
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toMatchObject({
            id,
            isActive: false,
        });

        const listResponse = await request(app).get(`/accounts/${accountId}/budget`);
        expect(listResponse.status).toBe(200);
        expect(listResponse.body.some((item: { id: number; isActive: boolean }) => item.id === id && item.isActive === false)).toBe(true);
    });

    it("hard deletes an item from the budget list", async () => {
        const createResponse = await request(app)
            .post(`/accounts/${accountId}/budget`)
            .send({
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
        expect(deletedItem).toBeNull();
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
                label: "Objectif",
                amount: 100,
                sortOrder: 0,
                posteId: otherPoste.id,
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("BUDGET_POSTE_INVALID");
    });
});
