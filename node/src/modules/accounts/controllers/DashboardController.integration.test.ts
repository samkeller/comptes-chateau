import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TEST_ACCOUNT_ID, fixtures } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";

let posteMaisonId: number;
let posteVoyageId: number;
const accountId = TEST_ACCOUNT_ID;

async function seedDashboardLines(): Promise<void> {
    const posteMaison = await fixtures.postes.create({ accountId, label: "Maison", color: "#445566" });
    const posteVoyage = await fixtures.postes.create({ accountId, label: "Voyage", color: "#778899" });

    posteMaisonId = posteMaison.id;
    posteVoyageId = posteVoyage.id;

    const checked = (dateValeur: string) => ({ isChecked: true, dateValeur: new Date(dateValeur) });
    await fixtures.accountLines.create({ accountId, posteId: posteMaison.id, label: "M1", dateOperation: new Date("2026-01-04"), debit: 100, ...checked("2026-01-05") });
    await fixtures.accountLines.create({ accountId, posteId: posteMaison.id, label: "M2", dateOperation: new Date("2026-01-10"), credit: 40 });
    await fixtures.accountLines.create({ accountId, posteId: posteMaison.id, label: "M3", dateOperation: new Date("2026-02-08"), credit: 70, ...checked("2026-02-09") });
    await fixtures.accountLines.create({ accountId, posteId: posteVoyage.id, label: "V1", dateOperation: new Date("2026-01-07"), credit: 20, ...checked("2026-01-08") });
    await fixtures.accountLines.create({ accountId, posteId: posteVoyage.id, label: "V2", dateOperation: new Date("2026-03-01"), debit: 10, ...checked("2026-03-02") });
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
        const sourceAccount = await fixtures.accounts.create({ id: sourceAccountId, label: "Source" });
        const targetAccount = await fixtures.accounts.create({ id: targetAccountId, label: "Cible" });
        const posteRevenu = await fixtures.postes.create({ accountId: targetAccount.id, label: "Revenu", color: "#aabbcc" });
        posteRevenuId = posteRevenu.id;

        const transfer = { label: "Virement sortant", dateOperation: new Date("2026-02-15"), transferGroupId: "dashboard-transfer-group" };
        await fixtures.accountLines.create({ ...transfer, accountId: sourceAccount.id, targetAccount: { id: targetAccount.id }, debit: 300 });
        await fixtures.accountLines.create({ ...transfer, accountId: targetAccount.id, targetAccount: { id: sourceAccount.id }, posteId: posteRevenu.id, credit: 300 });
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
