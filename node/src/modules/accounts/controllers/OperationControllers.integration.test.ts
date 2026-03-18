import express from "express";
import request from "supertest";
import { DataSource, EntityManager } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AccountLine, AccountLineSource } from "../entities/AccountLine";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { IMemoryDb } from "pg-mem";
import SetupTestDb from "../../../tests/SetupTests";
import { errorMiddleware } from "../../../utils/errorMiddleware";

let testDataSource: DataSource;
let natureChargesId: number;
let natureRevenusId: number;
let posteMaisonId: number;
let posteLoisirsId: number;

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => testDataSource.getRepository(entity),
        transaction: <T>(runInTransaction: (entityManager: EntityManager) => Promise<T>) =>
            testDataSource.transaction(runInTransaction)
    }
}));


async function seedAccountLines(dataSource: DataSource): Promise<void> {
    const natureRepo = dataSource.getRepository(AccountLineNature);
    const posteRepo = dataSource.getRepository(AccountLinePoste);
    const lineRepo = dataSource.getRepository(AccountLine);

    const natureCharges = await natureRepo.save({ label: "Charges", color: "#112233" });
    const natureRevenus = await natureRepo.save({ label: "Revenus", color: "#334455" });
    const posteMaison = await posteRepo.save({ label: "Maison", color: "#445566" });
    const posteLoisirs = await posteRepo.save({ label: "Loisirs", color: "#778899" });

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
    let db: IMemoryDb;

    beforeAll(async () => {
        db = SetupTestDb();

        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [AccountLine, AccountLineNature, AccountLinePoste],
            synchronize: true
        });

        await testDataSource.initialize();
        await seedAccountLines(testDataSource);

        const { default: operationRoutes } = await import("./OperationController");
        app = express();
        app.use(express.json());
        app.use("/operation", operationRoutes);
        app.use(errorMiddleware);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("sorts by amount ASC using (credit - debit)", async () => {
        const response = await request(app)
            .get("/operation/lazy")
            .query({ skip: "0", take: "50", sortField: "amount", sortOrder: "ASC" });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L1", "L2", "L3", "L4"]);
    });

    it("sorts by amount DESC using (credit - debit)", async () => {
        const response = await request(app)
            .get("/operation/lazy")
            .query({ skip: "0", take: "50", sortField: "amount", sortOrder: "DESC" });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L4", "L3", "L2", "L1"]);
    });

    it("applies amount operator filters (or)", async () => {
        const response = await request(app)
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
            .query({ skip: "0", take: "50", sortField: "dateValeur", sortOrder: "ASC" });

        expect(response.status).toBe(200);
        const labels = response.body.data.map((line: { label: string }) => line.label);

        expect(labels).toEqual(["L4", "L2", "L1", "L3"]);
    });

    it("returns 400 for disallowed sort field", async () => {
        const response = await request(app)
            .get("/operation/lazy")
            .query({ skip: "0", take: "50", sortField: "unknownField", sortOrder: "ASC" });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Sort field");
    });

    it("returns 400 for disallowed filter field", async () => {
        const response = await request(app)
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .get("/operation/lazy")
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
            .post("/operation")
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
            .get("/operation/lazy")
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
            .post("/operation/check-batch")
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
            .get("/operation/lazy")
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
});
