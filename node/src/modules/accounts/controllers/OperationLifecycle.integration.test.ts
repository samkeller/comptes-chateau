import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { Account } from "../entities/Account";
import { AccountLine } from "../entities/AccountLine";
import { User } from "../../core/entities/User";
import { testDataSource } from "../../../tests/testDbSetup";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";

const accountId = 1;
const targetAccountId = 2;
let seededUserId: number;

async function seedAccounts(): Promise<void> {
    const accountRepo = testDataSource.getRepository(Account);
    const userRepo = testDataSource.getRepository(User);

    const seededUser = await userRepo.save({
        username: "lifecycle-user",
        avatar: "001-tiger.png",
        totalXp: 0,
        passwordHash: "hash"
    });
    seededUserId = seededUser.id;

    await accountRepo.save([
        {
            id: accountId,
            label: "Compte principal",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01")
        },
        {
            id: targetAccountId,
            label: "Epargne",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01")
        }
    ]);
}

async function createTransfer(amount: number = 100): Promise<{ id: number; transferGroupId: string }> {
    const response = await request(app)
        .post(`/accounts/${accountId}/operations`)
        .send({
            label: "Virement",
            dateOperation: "2026-03-10",
            dateValeur: null,
            debit: amount,
            credit: 0,
            isChecked: false,
            targetAccount: { id: targetAccountId }
        });

    expect(response.status).toBe(200);
    return { id: response.body.id, transferGroupId: response.body.transferGroupId };
}

async function findGroupLines(transferGroupId: string): Promise<AccountLine[]> {
    return testDataSource.getRepository(AccountLine).find({
        where: { transferGroupId },
        relations: { account: true, targetAccount: true }
    });
}

let app: express.Express;

describe("Operation lifecycle - transfers (integration)", () => {
    beforeEach(async () => {
        await seedAccounts();

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

    it("delete removes both the line and its mirror", async () => {
        const { id, transferGroupId } = await createTransfer();

        const deleteResponse = await request(app).delete(`/accounts/${accountId}/operations/${id}`);
        expect(deleteResponse.status).toBe(204);

        const remainingLines = await findGroupLines(transferGroupId);
        expect(remainingLines).toHaveLength(0);
    });

    it("delete returns 404 for an unknown operation and does not touch other lines", async () => {
        const { transferGroupId } = await createTransfer();

        const deleteResponse = await request(app).delete(`/accounts/${accountId}/operations/9999`);
        expect(deleteResponse.status).toBe(404);
        expect(deleteResponse.body.code).toBe("OPERATION_NOT_FOUND");

        const remainingLines = await findGroupLines(transferGroupId);
        expect(remainingLines).toHaveLength(2);
    });

    it("editing a transfer amount keeps the mirror amounts in sync without overwriting its label", async () => {
        const { id, transferGroupId } = await createTransfer();

        // Le miroir a son propre label coté compte cible
        const mirror = (await findGroupLines(transferGroupId)).find((line) => line.id !== id)!;
        await testDataSource.getRepository(AccountLine).update(mirror.id, { label: "Remboursement prêt" });

        const updateResponse = await request(app)
            .put(`/accounts/${accountId}/operations/${id}`)
            .send({
                label: "Virement renommé",
                dateOperation: "2026-03-12",
                dateValeur: null,
                debit: 250,
                credit: 0,
                isChecked: false,
                targetAccount: { id: targetAccountId }
            });

        expect(updateResponse.status).toBe(200);

        const lines = await findGroupLines(transferGroupId);
        expect(lines).toHaveLength(2);

        const updatedMirror = lines.find((line) => line.id !== id)!;
        expect(Number(updatedMirror.credit)).toBe(250);
        expect(Number(updatedMirror.debit)).toBe(0);
        // Le label propre au compte cible est préservé
        expect(updatedMirror.label).toBe("Remboursement prêt");
        expect(String(updatedMirror.dateOperation).slice(0, 10)).toBe("2026-03-12");
    });

    it("check-batch propagates the check state to the mirror line", async () => {
        const { id, transferGroupId } = await createTransfer();

        const checkResponse = await request(app)
            .post(`/accounts/${accountId}/operations/check-batch`)
            .send({
                checks: [{ id, isChecked: true, dateValeur: "2026-03-15" }]
            });

        expect(checkResponse.status).toBe(200);
        expect(checkResponse.body.updatedCount).toBe(1);

        const lines = await findGroupLines(transferGroupId);
        expect(lines).toHaveLength(2);
        for (const line of lines) {
            expect(line.isChecked).toBe(true);
            expect(String(line.dateValeur).slice(0, 10)).toBe("2026-03-15");
        }
    });

    it("duplicate creates a complete new transfer pair with its own transferGroupId", async () => {
        const { id, transferGroupId } = await createTransfer(75);

        const duplicateResponse = await request(app)
            .post(`/accounts/${accountId}/operations/${id}/duplicate`);

        expect(duplicateResponse.status).toBe(200);
        expect(duplicateResponse.body.label).toBe("Virement (1)");
        expect(duplicateResponse.body.transferGroupId).toBeTruthy();
        expect(duplicateResponse.body.transferGroupId).not.toBe(transferGroupId);

        // L'ancien groupe est intact
        const originalLines = await findGroupLines(transferGroupId);
        expect(originalLines).toHaveLength(2);

        // Le nouveau groupe contient exactement 2 lignes miroir
        const duplicatedLines = await findGroupLines(duplicateResponse.body.transferGroupId);
        expect(duplicatedLines).toHaveLength(2);

        const duplicatedMirror = duplicatedLines.find((line) => line.id !== duplicateResponse.body.id)!;
        expect(duplicatedMirror.account.id).toBe(targetAccountId);
        expect(Number(duplicatedMirror.credit)).toBe(75);
        expect(Number(duplicatedMirror.debit)).toBe(0);
        // La copie repart non vérifiée
        expect(duplicatedLines.every((line) => !line.isChecked && line.dateValeur === null)).toBe(true);
    });

    it("converting a transfer back to a simple operation deletes the mirror", async () => {
        const { id, transferGroupId } = await createTransfer();

        const updateResponse = await request(app)
            .put(`/accounts/${accountId}/operations/${id}`)
            .send({
                label: "Dépense simple",
                dateOperation: "2026-03-10",
                dateValeur: null,
                debit: 100,
                credit: 0,
                isChecked: false,
                targetAccount: null
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.targetAccount).toBeNull();
        expect(updateResponse.body.transferGroupId).toBeNull();

        const remainingLines = await findGroupLines(transferGroupId);
        expect(remainingLines).toHaveLength(0);
    });

    it("editing the mirror line from the target account keeps the source line in sync", async () => {
        const { id, transferGroupId } = await createTransfer();
        const mirror = (await findGroupLines(transferGroupId)).find((line) => line.id !== id)!;

        const updateResponse = await request(app)
            .put(`/accounts/${targetAccountId}/operations/${mirror.id}`)
            .send({
                label: "Virement coté épargne",
                dateOperation: "2026-03-11",
                dateValeur: null,
                debit: 0,
                credit: 300,
                isChecked: false,
                targetAccount: { id: accountId }
            });

        expect(updateResponse.status).toBe(200);

        const lines = await findGroupLines(transferGroupId);
        const source = lines.find((line) => line.id === id)!;
        expect(Number(source.debit)).toBe(300);
        expect(Number(source.credit)).toBe(0);
        expect(String(source.dateOperation).slice(0, 10)).toBe("2026-03-11");
        // Le label de la source n'est pas écrasé par l'édition du miroir
        expect(source.label).toBe("Virement");
    });
});
