import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Account } from "../entities/Account";
import { AccountLine, AccountLineSource } from "../entities/AccountLine";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { testDataSource } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";

let posteMaisonId: number;
let posteVoyageId: number;
const accountId = 1;

async function seedDashboardLines(): Promise<void> {
    const accountRepo = testDataSource.getRepository(Account);
    const posteRepo = testDataSource.getRepository(AccountLinePoste);
    const lineRepo = testDataSource.getRepository(AccountLine);
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
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: dashboardRoutes } = await import("./DashboardController");
        app = createTestApp("/accounts/:accountId/dashboard", dashboardRoutes);
    });

    beforeEach(async () => {
        await seedDashboardLines();
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
                total: -60,
                budgetAmount: 0
            },
            {
                year: 2026,
                month: 1,
                posteId: posteVoyageId,
                posteLabel: "Voyage",
                posteColor: "#778899",
                total: 20,
                budgetAmount: 0
            },
            {
                year: 2026,
                month: 2,
                posteId: posteMaisonId,
                posteLabel: "Maison",
                posteColor: "#445566",
                total: 70,
                budgetAmount: 0
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
    let app: ReturnType<typeof createTestApp>;
    const sourceAccountId = 10;
    const targetAccountId = 11;
    let posteRevenuId: number;

    beforeAll(async () => {
        const { default: dashboardRoutes } = await import("./DashboardController");
        app = createTestApp("/accounts/:accountId/dashboard", dashboardRoutes);
    });

    beforeEach(async () => {
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
            total: 300,
            budgetAmount: 0
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
