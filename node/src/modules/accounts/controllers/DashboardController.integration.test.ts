import express from "express";
import request from "supertest";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AccountingLine, AccountingLineSource } from "../entities/AccountingLine";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import SetupTestDb from "../../../tests/SetupTests";

let testDataSource: DataSource;
let posteMaisonId: number;
let posteVoyageId: number;

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: <T>(entity: new () => T) => testDataSource.getRepository(entity)
    }
}));

async function seedDashboardLines(dataSource: DataSource): Promise<void> {
    const posteRepo = dataSource.getRepository(AccountLinePoste);
    const lineRepo = dataSource.getRepository(AccountingLine);

    const posteMaison = await posteRepo.save({ label: "Maison", color: "#445566" });
    const posteVoyage = await posteRepo.save({ label: "Voyage", color: "#778899" });

    posteMaisonId = posteMaison.id;
    posteVoyageId = posteVoyage.id;

    await lineRepo.save([
        {
            label: "M1",
            dateOperation: new Date("2026-01-04"),
            dateValeur: new Date("2026-01-05"),
            source: AccountingLineSource.MANUAL,
            poste: posteMaison,
            debit: 100,
            credit: 0,
            isChecked: true
        },
        {
            label: "M2",
            dateOperation: new Date("2026-01-10"),
            dateValeur: null,
            source: AccountingLineSource.MANUAL,
            poste: posteMaison,
            debit: 0,
            credit: 40,
            isChecked: false
        },
        {
            label: "M3",
            dateOperation: new Date("2026-02-08"),
            dateValeur: new Date("2026-02-09"),
            source: AccountingLineSource.MANUAL,
            poste: posteMaison,
            debit: 0,
            credit: 70,
            isChecked: true
        },
        {
            label: "V1",
            dateOperation: new Date("2026-01-07"),
            dateValeur: new Date("2026-01-08"),
            source: AccountingLineSource.MANUAL,
            poste: posteVoyage,
            debit: 0,
            credit: 20,
            isChecked: true
        },
        {
            label: "V2",
            dateOperation: new Date("2026-03-01"),
            dateValeur: new Date("2026-03-02"),
            source: AccountingLineSource.MANUAL,
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
            entities: [AccountingLine, AccountLineNature, AccountLinePoste],
            synchronize: true
        });

        await testDataSource.initialize();
        await seedDashboardLines(testDataSource);

        const { default: dashboardRoutes } = await import("./DashboardController");
        app = express();
        app.use(express.json());
        app.use("/dashboard", dashboardRoutes);
    });

    afterAll(async () => {
        if (testDataSource?.isInitialized) {
            await testDataSource.destroy();
        }
    });

    it("returns monthly aggregate filtered by date range and posteIds", async () => {
        const response = await request(app)
            .get("/dashboard/monthly-by-poste")
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
            .get("/dashboard/monthly-by-poste")
            .query({
                from: "2026-03-01",
                to: "2026-02-01",
                posteIds: "abc"
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("posteIds");
    });
});
