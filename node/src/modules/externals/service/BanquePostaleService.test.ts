import { beforeAll, describe, expect, it } from "vitest";
import type { Repository } from "typeorm";
import { Account } from "../../accounts/entities/Account";
import type { BanquePostaleImportPayload } from "@chocosous/shared";
import { TEST_ACCOUNT_ID, testDataSource } from "../../../tests/testDbSetup";
import BanquePostaleService from "./BanquePostaleService";
import { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";
import AccountLineService from "../../accounts/services/AccountLineService";

describe("BanquePostaleService.import", () => {
    let banquePostaleService: BanquePostaleService;
    let accountLineService: AccountLineService;
    let banquePostaleImportRepo: Repository<BanquePostaleOperationImport>;
    let accountRepo: Repository<Account>;

    beforeAll(() => {
        banquePostaleService = new BanquePostaleService(testDataSource.manager);
        accountLineService = new AccountLineService(testDataSource.manager);

        banquePostaleImportRepo = testDataSource.manager.getRepository(BanquePostaleOperationImport);
        accountRepo = testDataSource.manager.getRepository(Account);
    });

    const createPayload = (
        overrides: Partial<BanquePostaleImportPayload> = {}
    ): BanquePostaleImportPayload => ({
        accountId: 1,
        accountNumber: "123456789",
        type: "COURANT",
        balance: 1000,
        exportDate: "2026-09-08",
        operations: [],
        ...overrides,
    });

    const createUncheckedAccountLine = async ({
        dateOperation = "2026-09-08",
        debit = 25.5,
        credit = 0,
        accountId = 1,
        label = "Test operation",
    }: {
        dateOperation?: string;
        debit?: number;
        credit?: number;
        accountId?: number;
        label?: string;
    } = {}) => {
        return accountLineService.save({
            accountId,
            dateOperation: new Date(dateOperation),
            debit,
            credit,
            label,
            isChecked: false,
        });
    };

    it("should create new Banque Postale operations", async () => {
        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-01",
                        label: "CARREFOUR",
                        amount: -25.5,
                        rowNumber: 1,
                    },
                    {
                        dateOperation: "2026-09-02",
                        label: "NETFLIX",
                        amount: -15.99,
                        rowNumber: 2,
                    },
                ],
            })
        );

        const operations = await banquePostaleImportRepo.find();

        expect(result.linesProcessed).toBe(2);
        expect(result.linesCreated).toBe(2);
        expect(result.linesSkipped).toBe(0);

        expect(operations).toHaveLength(2);

        expect(operations[0].accountId).toBe(1);
        expect(operations[0].label).toBe("CARREFOUR");
        expect(operations[0].amount).toBe(-25.5);

        expect(operations[1].label).toBe("NETFLIX");
        expect(operations[1].amount).toBe(-15.99);
    });

    it("should skip operations that have already been imported", async () => {
        const payload = createPayload({
            operations: [
                {
                    dateOperation: "2026-09-01",
                    label: "CARREFOUR",
                    amount: -25.5,
                    rowNumber: 1,
                },
            ],
        });

        const firstImport = await banquePostaleService.import(payload);

        expect(firstImport.linesCreated).toBe(1);
        expect(firstImport.linesSkipped).toBe(0);

        const secondImport = await banquePostaleService.import(payload);

        const operations = await banquePostaleImportRepo.find();

        expect(secondImport.linesProcessed).toBe(1);
        expect(secondImport.linesCreated).toBe(0);
        expect(secondImport.linesSkipped).toBe(1);

        expect(operations).toHaveLength(1);
    });

    it("should return a matched candidate when exactly one operation matches", async () => {
        const accountLine = await createUncheckedAccountLine({
            dateOperation: "2026-09-08",
            debit: 25.5,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                ],
            })
        );

        expect(result.matched).toHaveLength(1);
        expect(result.ambiguous).toHaveLength(0);

        expect(result.matched[0]).toMatchObject({
            type: "matched",
            accountLineId: accountLine.id,
            candidate: {
                accountId: 1,
                label: "CARREFOUR",
                amount: 25.5,
                dateOperation: "2026-09-08",
            },
        });
    });

    it("should return ambiguous when multiple operations match", async () => {
        const accountLine = await createUncheckedAccountLine({
            dateOperation: "2026-09-08",
            debit: 25.5,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR 1",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR 2",
                        amount: 25.5,
                        rowNumber: 2,
                    },
                ],
            })
        );

        expect(result.matched).toHaveLength(0);
        expect(result.ambiguous).toHaveLength(1);

        expect(result.ambiguous[0]).toMatchObject({
            type: "ambiguous",
            accountLineId: accountLine.id,
        });

        expect(result.ambiguous[0].candidates).toHaveLength(2);

        expect(result.ambiguous[0].candidates).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    label: "CARREFOUR 1",
                    amount: 25.5,
                }),
                expect.objectContaining({
                    label: "CARREFOUR 2",
                    amount: 25.5,
                }),
            ])
        );
    });

    it("should not match when the amount is different", async () => {
        await createUncheckedAccountLine({
            dateOperation: "2026-09-08",
            debit: 30,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                ],
            })
        );

        expect(result.matched).toHaveLength(0);
        expect(result.ambiguous).toHaveLength(0);
    });

    it("should not match when the date is outside the two-day range", async () => {
        await createUncheckedAccountLine({
            dateOperation: "2026-09-08",
            debit: 25.5,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-04",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                ],
            })
        );

        expect(result.matched).toHaveLength(0);
        expect(result.ambiguous).toHaveLength(0);
    });

    it("should match when the date is exactly two days before", async () => {
        const accountLine = await createUncheckedAccountLine({
            dateOperation: "2026-09-08",
            debit: 25.5,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-06",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                ],
            })
        );

        expect(result.matched).toHaveLength(1);
        expect(result.matched[0].accountLineId).toBe(accountLine.id);
    });

    it("should match when the date is exactly two days after", async () => {
        const accountLine = await createUncheckedAccountLine({
            dateOperation: "2026-09-06",
            debit: 25.5,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                operations: [
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                ],
            })
        );

        expect(result.matched).toHaveLength(1);
        expect(result.matched[0].accountLineId).toBe(accountLine.id);
    });

    it("should not match an operation from another account", async () => {
        const newAccount = accountRepo.create({
            id: 2,
            label: "New Account",
            baseLineAmount: 0,
            baseLineEffectiveDate: "2026-09-08",
        });

        await accountRepo.save(newAccount);

        const accountLine = await createUncheckedAccountLine({
            accountId: newAccount.id,
            dateOperation: "2026-09-08",
            debit: 25.5,
            credit: 0,
        });

        const result = await banquePostaleService.import(
            createPayload({
                accountId: TEST_ACCOUNT_ID,
                operations: [
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 1,
                    },
                ],
            })
        );

        expect(newAccount.id).not.toBe(TEST_ACCOUNT_ID);
        expect(accountLine.accountId).toBe(newAccount.id);

        expect(result.matched).toHaveLength(0);
        expect(result.ambiguous).toHaveLength(0);
    });


    it("should preserve operation metadata", async () => {
        await banquePostaleService.import(
            createPayload({
                accountNumber: "FR123456789",
                type: "COURANT",
                balance: 1523.45,
                exportDate: "2026-09-08",
                operations: [
                    {
                        dateOperation: "2026-09-08",
                        label: "CARREFOUR",
                        amount: 25.5,
                        rowNumber: 42,
                    },
                ],
            })
        );

        const operation = await banquePostaleImportRepo.findOne({
            where: {
                label: "CARREFOUR",
            },
        });

        expect(operation).toBeDefined();
        expect(operation!.rowNumber).toBe(42);

        expect(operation!.metadata).toMatchObject({
            accountNumber: "FR123456789",
            type: "COURANT",
            balance: 1523.45,
            exportDate: "2026-09-08",
        });
    });
});
