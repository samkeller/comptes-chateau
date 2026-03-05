import express from "express";
import request from "supertest";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AccountingLine, AccountingLineSource } from "../entities/AccountingLine";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { IMemoryDb } from "pg-mem";
import SetupTestDb from "../tests/SetupTests";

let testDataSource: DataSource;
let natureChargesId: number;
let natureRevenusId: number;
let posteMaisonId: number;
let posteLoisirsId: number;

vi.mock("../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => testDataSource.getRepository(entity)
    }
}));


async function seedAccountingLines(dataSource: DataSource): Promise<void> {
    const natureRepo = dataSource.getRepository(AccountLineNature);
    const posteRepo = dataSource.getRepository(AccountLinePoste);
    const lineRepo = dataSource.getRepository(AccountingLine);

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
            dateValeur: new Date("2026-03-04"),
            source: AccountingLineSource.MANUAL,
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
            source: AccountingLineSource.MANUAL,
            nature: natureCharges,
            poste: posteLoisirs,
            debit: 20,
            credit: 0,
            isChecked: true
        },
        {
            label: "L3",
            dateOperation: new Date("2026-03-10"),
            dateValeur: new Date("2026-03-03"),
            source: AccountingLineSource.MANUAL,
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
            source: AccountingLineSource.MANUAL,
            nature: natureRevenus,
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
            entities: [AccountingLine, AccountLineNature, AccountLinePoste],
            synchronize: true
        });

        await testDataSource.initialize();
        await seedAccountingLines(testDataSource);

        const { default: operationRoutes } = await import("./OperationControllers");
        app = express();
        app.use(express.json());
        app.use("/operation", operationRoutes);
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

        expect(labels).toEqual(["L4", "L2", "L3", "L1"]);
    });

    it("returns 400 for disallowed sort field", async () => {
        const response = await request(app)
            .get("/operation/lazy")
            .query({ skip: "0", take: "50", sortField: "unknownField", sortOrder: "ASC" });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Sort field");
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
        expect(response.body.error).toContain("disallowed field");
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
});
