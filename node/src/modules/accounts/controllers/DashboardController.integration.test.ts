import express from "express";
import request from "supertest";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Account } from "../entities/Account";
import { AccountLine, AccountLineSource } from "../entities/AccountLine";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import SetupTestDb from "../../../tests/SetupTests";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";

let testDataSource: DataSource;
let posteMaisonId: number;
let posteVoyageId: number;
const accountId = 1;
const kanbanTaskRepoStub = {
    createQueryBuilder: vi.fn(() => ({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
    }))
};

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => {
            if ((entity as { name?: string }).name === "KanbanTask") {
                return kanbanTaskRepoStub;
            }
            return testDataSource.getRepository(entity);
        }
    }
}));

async function seedDashboardLines(dataSource: DataSource): Promise<void> {
    const accountRepo = dataSource.getRepository(Account);
    const posteRepo = dataSource.getRepository(AccountLinePoste);
    const lineRepo = dataSource.getRepository(AccountLine);
    const account = await accountRepo.save({
        id: accountId,
        label: "Compte principal",
        baseLineAmount: 0,
        baseLineEffectiveDate: new Date("2026-01-01")
    });

    const posteMaison = await posteRepo.save({ label: "Maison", color: "#445566", account });
    const posteVoyage = await posteRepo.save({ label: "Voyage", color: "#778899", account });

    posteMaisonId = posteMaison.id;
    posteVoyageId = posteVoyage.id;

    await lineRepo.save([
        {
            label: "M1",
            dateOperation: new Date("2026-01-04"),
            dateValeur: new Date("2026-01-05"),
            source: AccountLineSource.MANUAL,
            account,
            poste: posteMaison,
            debit: 100,
            credit: 0,
            isChecked: true
        },
        {
            label: "M2",
            dateOperation: new Date("2026-01-10"),
            dateValeur: null,
            source: AccountLineSource.MANUAL,
            account,
            poste: posteMaison,
            debit: 0,
            credit: 40,
            isChecked: false
        },
        {
            label: "M3",
            dateOperation: new Date("2026-02-08"),
            dateValeur: new Date("2026-02-09"),
            source: AccountLineSource.MANUAL,
            account,
            poste: posteMaison,
            debit: 0,
            credit: 70,
            isChecked: true
        },
        {
            label: "V1",
            dateOperation: new Date("2026-01-07"),
            dateValeur: new Date("2026-01-08"),
            source: AccountLineSource.MANUAL,
            account,
            poste: posteVoyage,
            debit: 0,
            credit: 20,
            isChecked: true
        },
        {
            label: "V2",
            dateOperation: new Date("2026-03-01"),
            dateValeur: new Date("2026-03-02"),
            source: AccountLineSource.MANUAL,
            account,
            poste: posteVoyage,
            debit: 10,
            credit: 0,
            isChecked: true
        }
    ]);
}

describe("DashboardController /monthly-by-poste integration", () => {
    let app: express.Express;

    beforeAll(async () => {
        const db = SetupTestDb();

        testDataSource = db.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [Account, AccountLine, AccountLineNature, AccountLinePoste],
            synchronize: true
        });

        await testDataSource.initialize();
        await seedDashboardLines(testDataSource);

        const { default: dashboardRoutes } = await import("./DashboardController");
        app = express();
        app.use(express.json());
        app.use("/accounts/:accountId/dashboard", dashboardRoutes);
        app.use(errorMiddleware);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("returns monthly aggregate filtered by date range and posteIds", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/dashboard/monthly-by-poste`)
            .query({
                from: "2026-01-01",
                to: "2026-02-28",
                posteIds: `${posteMaisonId},${posteVoyageId}`
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                year: 2026,
                month: 1,
                posteId: posteMaisonId,
                posteLabel: "Maison",
                posteColor: "#445566",
                total: -60
            },
            {
                year: 2026,
                month: 1,
                posteId: posteVoyageId,
                posteLabel: "Voyage",
                posteColor: "#778899",
                total: 20
            },
            {
                year: 2026,
                month: 2,
                posteId: posteMaisonId,
                posteLabel: "Maison",
                posteColor: "#445566",
                total: 70
            }
        ]);
    });

    it("returns 400 for invalid query params", async () => {
        const response = await request(app)
            .get(`/accounts/${accountId}/dashboard/monthly-by-poste`)
            .query({
                from: "2026-03-01",
                to: "2026-02-01",
                posteIds: "abc"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("posteIds");
    });
});

describe("DashboardController monthly-by-poste with incoming transfers", () => {
    let app: express.Express;
    const sourceAccountId = 10;
    const targetAccountId = 11;
    let posteRevenuId: number;

    beforeAll(async () => {
        // Reassign module-level testDataSource so the top-level vi.mock can pick it up
        const transferDb = SetupTestDb();
        testDataSource = transferDb.adapters.createTypeormDataSource({
            type: "postgres",
            entities: [Account, AccountLine, AccountLineNature, AccountLinePoste],
            synchronize: true
        });
        await testDataSource.initialize();

        const accountRepo = testDataSource.getRepository(Account);
        const posteRepo = testDataSource.getRepository(AccountLinePoste);
        const lineRepo = testDataSource.getRepository(AccountLine);

        const sourceAccount = await accountRepo.save({
            id: sourceAccountId,
            label: "Source",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01")
        });
        const targetAccount = await accountRepo.save({
            id: targetAccountId,
            label: "Cible",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01")
        });

        const posteRevenu = await posteRepo.save({ label: "Revenu", color: "#aabbcc", account: targetAccount });
        posteRevenuId = posteRevenu.id;

        const transferGroupId = "dashboard-transfer-group";

        await lineRepo.save([
            {
                label: "Virement sortant",
                dateOperation: new Date("2026-02-15"),
                dateValeur: null,
                source: AccountLineSource.MANUAL,
                account: sourceAccount,
                targetAccount: targetAccount,
                transferGroupId,
                debit: 300,
                credit: 0,
                isChecked: false
            },
            {
                label: "Virement sortant",
                dateOperation: new Date("2026-02-15"),
                dateValeur: null,
                source: AccountLineSource.MANUAL,
                account: targetAccount,
                targetAccount: sourceAccount,
                transferGroupId,
                poste: posteRevenu,
                debit: 0,
                credit: 300,
                isChecked: false
            }
        ]);

        const { default: dashboardRoutes } = await import("./DashboardController");
        app = express();
        app.use(express.json());
        app.use("/accounts/:accountId/dashboard", dashboardRoutes);
        app.use(errorMiddleware);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("target account aggregate includes incoming transfer mirror line", async () => {
        const response = await request(app)
            .get(`/accounts/${targetAccountId}/dashboard/monthly-by-poste`)
            .query({
                from: "2026-02-01",
                to: "2026-02-28",
                posteIds: `${posteRevenuId}`
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
            year: 2026,
            month: 2,
            posteId: posteRevenuId,
            total: 300
        });
    });

    it("source account has no lines for the target poste", async () => {
        const response = await request(app)
            .get(`/accounts/${sourceAccountId}/dashboard/monthly-by-poste`)
            .query({
                from: "2026-02-01",
                to: "2026-02-28",
                posteIds: `${posteRevenuId}`
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });
});
