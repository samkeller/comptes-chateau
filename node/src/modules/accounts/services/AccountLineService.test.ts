import { beforeEach, describe, expect, it } from "vitest";
import { testDataSource, TEST_ACCOUNT_ID } from "../../../tests/testDbSetup";
import { AccountLine, AccountLineSource } from "../entities/AccountLine";
import AccountLineService from "./AccountLineService";

describe("AccountLineService.saveAll", () => {
    let service: AccountLineService;

    beforeEach(() => {
        service = new AccountLineService(testDataSource.manager);
    });

    it("normalizes API dates before saving generated account lines", async () => {
        const [savedLine] = await service.saveAll([{
            accountId: TEST_ACCOUNT_ID,
            label: "Courses",
            dateOperation: "2026-03-18" as unknown as Date,
            isChecked: false,
            dateValeur: null,
            debit: 25,
            credit: 0,
            source: AccountLineSource.MANUAL,
        }]);

        expect(savedLine.id).toBeTypeOf("number");
        expect(savedLine.dateOperation).toBeInstanceOf(Date);
        expect(savedLine.dateOperation.getFullYear()).toBe(2026);
        expect(savedLine.dateOperation.getMonth()).toBe(2);
        expect(savedLine.dateOperation.getDate()).toBe(18);
    });

    it("rejects an invalid batch before persisting any line", async () => {
        await expect(service.saveAll([
            {
                accountId: TEST_ACCOUNT_ID,
                label: "Valide",
                dateOperation: "2026-03-01" as unknown as Date,
                isChecked: false,
                dateValeur: null,
                debit: 10,
                credit: 0,
                source: AccountLineSource.MANUAL,
            },
            {
                accountId: TEST_ACCOUNT_ID,
                label: "Invalide",
                dateOperation: "2026-03-02" as unknown as Date,
                isChecked: true,
                dateValeur: null,
                debit: 20,
                credit: 0,
                source: AccountLineSource.MANUAL,
            },
        ])).rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });

        expect(await testDataSource.getRepository(AccountLine).count()).toBe(0);
    });

    it("preserves the persisted check state when updating unrelated fields", async () => {
        const accountLineRepo = testDataSource.getRepository(AccountLine);
        const existingLine = await accountLineRepo.save({
            accountId: TEST_ACCOUNT_ID,
            label: "Ligne vérifiée",
            dateOperation: new Date("2026-03-01T00:00:00.000Z"),
            isChecked: true,
            dateValeur: new Date("2026-03-02T00:00:00.000Z"),
            debit: 25,
            credit: 0,
            source: AccountLineSource.MANUAL,
        });

        await service.saveAll([{
            id: existingLine.id,
            label: "Ligne renommée",
        }]);

        const persistedLine = await accountLineRepo.findOneByOrFail({ id: existingLine.id });
        expect(persistedLine.label).toBe("Ligne renommée");
        expect(persistedLine.isChecked).toBe(true);
        expect(persistedLine.dateValeur).not.toBeNull();
    });
});