import { beforeEach, describe, expect, it } from "vitest";
import { TEST_ACCOUNT_ID, testDataSource } from "../../../tests/testDbSetup";
import { Account } from "../../accounts/entities/Account";
import { AccountLine, AccountLineSource } from "../../accounts/entities/AccountLine";
import { AccountLinePoste } from "../../accounts/entities/AccountLinePoste";
import { AccountLineRule } from "../entities/AccountLineRule";
import AccountLineCategorizationService from "./AccountLineCategorizationService";
import { AccountLineRuleValidationError } from "./errors/AccountLineRuleErrors";

describe("AccountLineCategorizationService", () => {
    let service: AccountLineCategorizationService;

    beforeEach(() => {
        service = new AccountLineCategorizationService(testDataSource.manager);
    });

    async function seedPattern(accountId: number, label: string, count: number): Promise<AccountLinePoste> {
        const poste = await testDataSource.getRepository(AccountLinePoste).save({
            accountId,
            label: `Loisirs ${accountId}`,
            color: "#123456",
        });

        await testDataSource.getRepository(AccountLine).save(
            Array.from({ length: count }, (_, index) => ({
                accountId,
                posteId: poste.id,
                label,
                debit: 10 + index,
                credit: 0,
                isChecked: false,
                dateValeur: null,
                dateOperation: new Date(`2026-03-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
                source: AccountLineSource.MANUAL,
            }))
        );

        return poste;
    }

    it("returns normalized suggestions when a pattern reaches the frequency threshold", async () => {
        const poste = await seedPattern(TEST_ACCOUNT_ID, "Café Paris", 3);

        const result = await service.getUnmapped();

        expect(result).toEqual([{
            pattern: "cafe paris",
            label: "Café paris",
            count: 3,
            account: { id: TEST_ACCOUNT_ID, label: "testaccount0" },
            suggestedPoste: { id: poste.id, label: poste.label, color: poste.color },
            suggestedNature: null,
        }]);
    });

    it("filters out patterns below the frequency threshold", async () => {
        await seedPattern(TEST_ACCOUNT_ID, "Café Paris", 2);

        await expect(service.getUnmapped()).resolves.toEqual([]);
    });

    it("does not return a pattern that already has a rule", async () => {
        await seedPattern(TEST_ACCOUNT_ID, "Café Paris", 3);
        await testDataSource.getRepository(AccountLineRule).save({
            accountId: TEST_ACCOUNT_ID,
            label: "Café paris",
            pattern: "cafe paris",
            occurrencesCount: 3,
            posteId: null,
            natureId: null,
        });

        await expect(service.getUnmapped()).resolves.toEqual([]);
    });

    it("keeps patterns isolated by account", async () => {
        const secondAccountId = 2;
        await testDataSource.getRepository(Account).save({
            id: secondAccountId,
            label: "Compte B",
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2026-01-01T00:00:00.000Z"),
        });
        await seedPattern(TEST_ACCOUNT_ID, "Café Paris", 1);
        const secondPoste = await seedPattern(secondAccountId, "Cafe Paris", 3);
        await testDataSource.getRepository(AccountLineRule).save({
            accountId: TEST_ACCOUNT_ID,
            label: "Cafe paris",
            pattern: "cafe paris",
            occurrencesCount: 1,
            posteId: null,
            natureId: null,
        });

        const result = await service.getUnmapped();

        expect(result).toEqual([{
            pattern: "cafe paris",
            label: "Cafe paris",
            count: 3,
            account: { id: secondAccountId, label: "Compte B" },
            suggestedPoste: { id: secondPoste.id, label: secondPoste.label, color: secondPoste.color },
            suggestedNature: null,
        }]);
    });

    it("rejects a poste that does not belong to the target account", async () => {
        const rule = await testDataSource.getRepository(AccountLineRule).save({
            accountId: TEST_ACCOUNT_ID,
            label: "Ancien motif",
            pattern: "ancien motif",
            occurrencesCount: 0,
            posteId: null,
            natureId: null,
        });

        await expect(service.updateById(rule.id, {
            label: "Nouveau motif",
            accountId: TEST_ACCOUNT_ID,
            posteId: 999,
        })).rejects.toBeInstanceOf(AccountLineRuleValidationError);

        const persistedRule = await testDataSource.getRepository(AccountLineRule).findOneByOrFail({ id: rule.id });
        expect(persistedRule.pattern).toBe("ancien motif");
    });
});