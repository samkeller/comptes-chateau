import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type { BanquePostaleImportPayload } from "@chocosous/shared";
import { createTestApp } from "../../../tests/testApp";
import { TEST_ACCOUNT_ID, testDataSource } from "../../../tests/testDbSetup";
import { AccountLine, AccountLineSource } from "../../accounts/entities/AccountLine";
import { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";

describe("BanquePostale Integration Tests", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: banquePostaleRoutes } = await import("./BanquePostaleController");

        app = createTestApp("/accounts/:accountId/banquepostale", banquePostaleRoutes);
    });

    it("imports operations, reports matching outcomes and stays idempotent", async () => {
        const accountLineRepository = testDataSource.getRepository(AccountLine);
        const importedOperationRepository = testDataSource.getRepository(BanquePostaleOperationImport);

        const createUncheckedLine = async (line: Partial<AccountLine>) => accountLineRepository.save({
            accountId: TEST_ACCOUNT_ID,
            debit: 0,
            credit: 0,
            label: "Fixture",
            isChecked: false,
            dateOperation: new Date("2026-09-08"),
            dateValeur: null,
            source: AccountLineSource.MANUAL,
            ...line,
        });

        const matchedDebit = await createUncheckedLine({
            debit: 25.5,
            label: "Débit exact",
        });
        const matchedCredit = await createUncheckedLine({
            credit: 12,
            label: "Crédit exact",
        });
        const matchedAtLowerDateBoundary = await createUncheckedLine({
            debit: 30,
            label: "Borne basse",
        });
        const matchedAtUpperDateBoundary = await createUncheckedLine({
            debit: 31,
            dateOperation: new Date("2026-09-06"),
            label: "Borne haute",
        });
        const ambiguousLine = await createUncheckedLine({
            debit: 40,
            label: "Ambiguïté",
        });
        await createUncheckedLine({ debit: 99, label: "Montant différent" });
        await createUncheckedLine({ debit: 88, label: "Date hors fenêtre" });
        const checkedLine = await accountLineRepository.save({
            accountId: TEST_ACCOUNT_ID,
            debit: 77,
            credit: 0,
            label: "Déjà vérifiée",
            isChecked: true,
            dateOperation: new Date("2026-09-08"),
            dateValeur: new Date("2026-09-08"),
            source: AccountLineSource.MANUAL,
        });

        const payload: BanquePostaleImportPayload = {
            accountId: TEST_ACCOUNT_ID,
            accountNumber: "2245945T038",
            type: "CCP",
            exportDate: "2026-09-09",
            balance: 1159.39,
            operations: [
                { dateOperation: "2026-09-08", label: "Débit exact importé", amount: -25.5, rowNumber: 1 },
                { dateOperation: "2026-09-08", label: "Crédit exact importé", amount: 12, rowNumber: 2 },
                { dateOperation: "2026-09-06", label: "Borne basse importée", amount: -30, rowNumber: 3 },
                { dateOperation: "2026-09-08", label: "Borne haute importée", amount: -31, rowNumber: 4 },
                { dateOperation: "2026-09-08", label: "Candidat ambigu 1", amount: -40, rowNumber: 5 },
                { dateOperation: "2026-09-08", label: "Candidat ambigu 2", amount: -40, rowNumber: 6 },
                { dateOperation: "2026-09-08", label: "Montant sans match", amount: -98.99, rowNumber: 7 },
                { dateOperation: "2026-09-05", label: "Date sans match", amount: -88, rowNumber: 8 },
                { dateOperation: "2026-09-08", label: "Ligne déjà vérifiée", amount: -77, rowNumber: 9 },
            ],
        };

        const response = await request(app)
            .post(`/accounts/${TEST_ACCOUNT_ID}/banquepostale/import`)
            .send(payload);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            linesProcessed: 9,
            linesCreated: 9,
            linesSkipped: 0,
        });
        expect(response.body.matched).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: "matched", accountLineId: matchedDebit.id }),
            expect.objectContaining({ type: "matched", accountLineId: matchedCredit.id }),
            expect.objectContaining({ type: "matched", accountLineId: matchedAtLowerDateBoundary.id }),
            expect.objectContaining({ type: "matched", accountLineId: matchedAtUpperDateBoundary.id }),
        ]));
        expect(response.body.matched).toHaveLength(4);
        expect(response.body.ambiguous).toEqual([
            expect.objectContaining({
                type: "ambiguous",
                accountLineId: ambiguousLine.id,
                candidates: expect.arrayContaining([
                    expect.objectContaining({ label: "Candidat ambigu 1", amount: -40 }),
                    expect.objectContaining({ label: "Candidat ambigu 2", amount: -40 }),
                ]),
            }),
        ]);
        expect(response.body.ambiguous[0].candidates).toHaveLength(2);
        expect(response.body.matched).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ accountLineId: checkedLine.id }),
        ]));

        const persistedOperations = await importedOperationRepository.find();
        expect(persistedOperations).toHaveLength(9);
        expect(persistedOperations.every((operation) => operation.accountId === TEST_ACCOUNT_ID)).toBe(true);

        const repeatedResponse = await request(app)
            .post(`/accounts/${TEST_ACCOUNT_ID}/banquepostale/import`)
            .send(payload);

        expect(repeatedResponse.status).toBe(200);
        expect(repeatedResponse.body).toMatchObject({
            linesProcessed: 9,
            linesCreated: 0,
            linesSkipped: 9,
        });
        expect(repeatedResponse.body.matched).toHaveLength(4);
        expect(repeatedResponse.body.ambiguous).toEqual([
            expect.objectContaining({
                accountLineId: ambiguousLine.id,
                candidates: expect.arrayContaining([
                    expect.objectContaining({ label: "Candidat ambigu 1", amount: -40 }),
                    expect.objectContaining({ label: "Candidat ambigu 2", amount: -40 }),
                ]),
            }),
        ]);
        expect(await importedOperationRepository.count()).toBe(9);
    });

});