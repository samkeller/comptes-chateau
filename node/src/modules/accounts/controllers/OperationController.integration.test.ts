import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { Account } from "../entities/Account";
import { AccountLine, AccountLineSource } from "../entities/AccountLine";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { User } from "../../core/entities/User";
import { testDataSource } from "../../../tests/testDbSetup";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";

let seededUserId: number;
let natureChargesId: number;
let natureRevenusId: number;
let posteMaisonId: number;
let posteLoisirsId: number;
const accountId = 1;

async function seedAccountLines(): Promise<void> {
    const accountRepo = testDataSource.getRepository(Account);
    const natureRepo = testDataSource.getRepository(AccountLineNature);
    const posteRepo = testDataSource.getRepository(AccountLinePoste);
    const lineRepo = testDataSource.getRepository(AccountLine);
    const userRepo = testDataSource.getRepository(User);

    const seededUser = await userRepo.save({
        username: "dojo-user",
        avatar: "001-tiger.png",
        totalXp: 100,
        passwordHash: "hash"
    });
    seededUserId = seededUser.id;

    const account = await accountRepo.save({
        id: accountId,
        label: "Compte principal",
        baseLineAmount: 0,
        baseLineEffectiveDate: new Date("2026-01-01")
    });

    const natureCharges = await natureRepo.save({ label: "Charges", color: "#112233" });
    const natureRevenus = await natureRepo.save({ label: "Revenus", color: "#334455" });
    const posteMaison = await posteRepo.save({ label: "Maison", color: "#445566", account });
    const posteLoisirs = await posteRepo.save({ label: "Loisirs", color: "#778899", account });

    natureChargesId = natureCharges.id;
    natureRevenusId = natureRevenus.id;
    posteMaisonId = posteMaison.id;
    posteLoisirsId = posteLoisirs.id;

    const baseDateOperation = new Date("2026-03-01");

    await lineRepo.save([
        {
            label: "L1",
            dateOperation: baseDateOperation,
            dateValeur: null,
            source: AccountLineSource.MANUAL,
            account,
            nature: natureCharges,
            poste: posteMaison,
            debit: 100,
            credit: 0,
            isChecked: false
        },
        {
            label: "L2",
            dateOperation: new Date("2026-03-05"),
            dateValeur: new Date("2026-03-02"),
            source: AccountLineSource.MANUAL,
            account,
            nature: natureCharges,
            poste: undefined,
            debit: 20,
            credit: 0,
            isChecked: true
        },
        {
            label: "L3",
            dateOperation: new Date("2026-03-10"),
            dateValeur: null,
            source: AccountLineSource.MANUAL,
            account,
            nature: natureRevenus,
            poste: posteMaison,
            debit: 0,
            credit: 50,
            isChecked: false
        },
        {
            label: "L4",
            dateOperation: new Date("2026-03-15"),
            dateValeur: new Date("2026-03-01"),
            source: AccountLineSource.MANUAL,
            account,
            nature: undefined,
            poste: posteLoisirs,
            debit: 0,
            credit: 120,
            isChecked: true
        }
    ]);
}

describe("OperationControllers /lazy integration", () => {
    let app: express.Express;

    beforeEach(async () => {
        await seedAccountLines();

        const { default: accountScopedRoutes } = await import("./AccountScopedRoutes");
        app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            (req as any).session = { userId: seededUserId };
            next();
        });
        app.use("/accounts/:accountId", accountScopedRoutes);
        app.use(errorMiddleware);
    });

    it("sorts by amount ASC using (credit - debit)", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({ skip: "0", take: "50", sortField: "amount", sortOrder: "ASC" });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L1", "L2", "L3", "L4"]);
    });

    it("returns 404 when accountId does not exist", async () => {
        const response = await request(app)
            .get("/accounts/999/operations/lazy")
            .query({ skip: "0", take: "50", sortField: "amount", sortOrder: "ASC" });

        expect(response.status).toBe(404);
        expect(response.body.code).toBe("ACCOUNT_NOT_FOUND");
    });

    it("returns all operations for export", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/export`);

        expect(response.status).toBe(200);
        const labels = response.body.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L4", "L3", "L2", "L1"]);
    });

    it("sorts by amount DESC using (credit - debit)", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({ skip: "0", take: "50", sortField: "amount", sortOrder: "DESC" });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L4", "L3", "L2", "L1"]);
    });

    it("applies amount operator filters (or)", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "operator",
                        field: "amount",
                        operator: "or",
                        constraints: [
                            { matchMode: "lt", value: -50 },
                            { matchMode: "gt", value: 100 }
                        ]
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L1", "L4"]);
    });

    it("applies amount simple filter (equals)", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "amount",
                        matchMode: "equals",
                        value: 50
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L3"]);
    });

    it("sorts by dateValeur ASC", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({ skip: "0", take: "50", sortField: "dateValeur", sortOrder: "ASC" });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L4", "L2", "L1", "L3"]);
    });

    it("returns 400 for disallowed sort field", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({ skip: "0", take: "50", sortField: "unknownField", sortOrder: "ASC" });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Sort field");
    });

    it("returns 400 for disallowed filter field", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "unknownField",
                        matchMode: "equals",
                        value: "x"
                    }
                ])
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("disallowed field");
    });

    it("filters by nature.label equals", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "nature.label",
                        matchMode: "equals",
                        value: natureChargesId
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L1", "L2"]);
    });

    it("filters by poste.label equals", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "poste.label",
                        matchMode: "equals",
                        value: posteMaisonId
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L1", "L3"]);
    });

    it("filters by nature.label equals null", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "nature.label",
                        matchMode: "equals",
                        value: "null"
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L4"]);
    });

    it("filters by poste.label equals null", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "poste.label",
                        matchMode: "equals",
                        value: "null"
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L2"]);
    });

    it("filters by isChecked equals true", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "isChecked",
                        matchMode: "equals",
                        value: true
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L2", "L4"]);
    });

    it("filters dateOperation between bounds", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "dateOperation",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "dateOperation",
                        matchMode: "between",
                        value: ["2026-03-04", "2026-03-12"]
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L2", "L3"]);
    });

    it("applies amount in/notIn constraints", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "amount",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "operator",
                        field: "amount",
                        operator: "and",
                        constraints: [
                            { matchMode: "in", value: [-100, -20, 50] },
                            { matchMode: "notIn", value: [-20] }
                        ]
                    }
                ])
            });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L1", "L3"]);
    });

    it("returns 400 when saving checked operation without dateValeur", async () => {
        const response = await request(app)
            .post(`/accounts/${accountId}/operations`)
            .send({
                label: "Invalid checked",
                dateOperation: "2026-03-20",
                dateValeur: null,
                source: AccountLineSource.MANUAL,
                debit: 0,
                credit: 10,
                isChecked: true
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("checked operation must have a dateValeur");
    });

    it("checks operations in batch with dateValeur and hides them from unchecked filter", async () => {
        const uncheckedBefore = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "dateOperation",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "isChecked",
                        matchMode: "equals",
                        value: false
                    }
                ])
            });

        const idsToCheck = uncheckedBefore.body.data.map((line: { id: number }) => line.id);
        expect(idsToCheck.length).toBeGreaterThan(0);

        const batchResponse = await request(app)
            .post(`/accounts/${accountId}/operations/check-batch`)
            .send({
                checks: idsToCheck.map((id: number) => ({
                    id,
                    isChecked: true,
                    dateValeur: "2026-03-21"
                }))
            });

        expect(batchResponse.status).toBe(200);
        expect(batchResponse.body.updatedCount).toBe(idsToCheck.length);

        const uncheckedAfter = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({
                skip: "0",
                take: "50",
                sortField: "dateOperation",
                sortOrder: "ASC",
                filters: JSON.stringify([
                    {
                        type: "simple",
                        field: "isChecked",
                        matchMode: "equals",
                        value: false
                    }
                ])
            });

        expect(uncheckedAfter.status).toBe(200);
        expect(uncheckedAfter.body.data).toEqual([]);
    });

    it("POST creates a transfer: source gets debit line, target gets mirror credit line, visible via /lazy on both accounts", async () => {
        const targetAccountId = 2;
        const lineRepo = testDataSource.getRepository(AccountLine);
        const accountRepo = testDataSource.getRepository(Account);

        await accountRepo.save({
            id: targetAccountId,
            label: "Epargne",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01")
        });

        const response = await request(app)
            .post(`/accounts/${accountId}/operations`)
            .send({
                label: "Virement test",
                dateOperation: "2026-03-25",
                dateValeur: null,
                debit: 200,
                credit: 0,
                isChecked: false,
                targetAccount: { id: targetAccountId }
            });

        expect(response.status).toBe(200);
        expect(response.body.transferGroupId).toBeTruthy();
        expect(response.body.targetAccount.id).toBe(targetAccountId);

        const allLines = await lineRepo.findBy({ transferGroupId: response.body.transferGroupId });
        expect(allLines).toHaveLength(2);

        const mirror = allLines.find((l) => l.id !== response.body.id);
        expect(Number(mirror?.debit)).toBe(0);
        expect(Number(mirror?.credit)).toBe(200);
        const mirrorWithAccount = await lineRepo.findOne({ where: { id: mirror!.id }, relations: { account: true } });
        expect(mirrorWithAccount?.account.id).toBe(targetAccountId);

        const lazySourceResponse = await request(app)
            .get(`/accounts/${accountId}/operations/lazy`)
            .query({ skip: "0", take: "200", sortField: "dateOperation", sortOrder: "DESC" });

        expect(lazySourceResponse.status).toBe(200);
        const sourceTransfers = lazySourceResponse.body.data.filter(
            (l: { label: string }) => l.label === "Virement test"
        );
        expect(sourceTransfers.length).toBe(1);

        const lazyTargetResponse = await request(app)
            .get(`/accounts/${targetAccountId}/operations/lazy`)
            .query({ skip: "0", take: "200", sortField: "dateOperation", sortOrder: "DESC" });

        expect(lazyTargetResponse.status).toBe(200);
        const targetTransfers = lazyTargetResponse.body.data.filter(
            (l: { label: string }) => l.label === "Virement test"
        );
        expect(targetTransfers.length).toBe(1);
        expect(Number(targetTransfers[0].credit)).toBe(200);
    });

    it("POST rejects a transfer when source and target account are the same", async () => {
        const response = await request(app)
            .post(`/accounts/${accountId}/operations`)
            .send({
                label: "Virement invalide",
                dateOperation: "2026-03-25",
                debit: 50,
                credit: 0,
                isChecked: false,
                targetAccount: { id: accountId }
            });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("OPERATION_TRANSFER_SAME_ACCOUNT");
    });
});
