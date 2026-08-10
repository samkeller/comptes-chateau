import { describe, expect, it, vi } from "vitest";
import AccountLineCategorizationService from "./AccountLineCategorizationService";
import { AccountLineRuleValidationError } from "./rules/errors/AccountLineRuleErrors";

type RuleRecord = { pattern: string; accountId: number };
type LineRecord = {
    id: number;
    accountId: number;
    label: string;
    poste: { id: number; label: string; color: string } | null;
    nature: { id: number; label: string; color: string } | null;
    account: { id: number; label: string };
};

function createService(existingRules: RuleRecord[], lines: LineRecord[]) {
    const service = new AccountLineCategorizationService();

    const ruleRepo = {
        find: vi.fn().mockResolvedValue(existingRules),
    };
    const lineRepo = {
        find: vi.fn().mockResolvedValue(lines),
    };

    (service as unknown as { ruleRepo: typeof ruleRepo; lineRepo: typeof lineRepo }).ruleRepo = ruleRepo;
    (service as unknown as { ruleRepo: typeof ruleRepo; lineRepo: typeof lineRepo }).lineRepo = lineRepo;

    return { service, ruleRepo, lineRepo };
}

describe("AccountLineCategorizationService.getUnmapped", () => {
    it("returns normalized suggestions when a pattern reaches the frequency threshold", async () => {
        const { service } = createService([], [
            {
                id: 1,
                accountId: 1,
                label: "Café Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 2,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 3,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
        ]);

        const result = await service.getUnmapped();

        expect(result).toEqual([
            {
                pattern: "cafe paris",
                count: 3,
                account: { id: 1, label: "Compte courant" },
                suggestedPoste: { id: 10, label: "Loisirs", color: "#123456" },
                suggestedNature: null,
            },
        ]);
    });

    it("filters out patterns that are below the frequency threshold", async () => {
        const { service } = createService([], [
            {
                id: 1,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 2,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
        ]);

        const result = await service.getUnmapped();

        expect(result).toEqual([]);
    });

    it("does not return a pattern that already has a rule configured", async () => {
        const { service } = createService([{ pattern: "cafe paris", accountId: 1 }], [
            {
                id: 1,
                accountId: 1,
                label: "Café Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 2,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 3,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
        ]);

        const result = await service.getUnmapped();

        expect(result).toEqual([]);
    });

    it("keeps patterns isolated by account", async () => {
        const { service } = createService([{ pattern: "cafe paris", accountId: 1 }], [
            {
                id: 1,
                accountId: 1,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs A", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte A" },
            },
            {
                id: 2,
                accountId: 2,
                label: "Cafe Paris",
                poste: { id: 20, label: "Loisirs B", color: "#654321" },
                nature: null,
                account: { id: 2, label: "Compte B" },
            },
            {
                id: 3,
                accountId: 2,
                label: "Cafe Paris",
                poste: { id: 20, label: "Loisirs B", color: "#654321" },
                nature: null,
                account: { id: 2, label: "Compte B" },
            },
            {
                id: 4,
                accountId: 2,
                label: "Cafe Paris",
                poste: { id: 20, label: "Loisirs B", color: "#654321" },
                nature: null,
                account: { id: 2, label: "Compte B" },
            },
        ]);

        const result = await service.getUnmapped();

        expect(result).toEqual([
            {
                pattern: "cafe paris",
                count: 3,
                account: { id: 2, label: "Compte B" },
                suggestedPoste: { id: 20, label: "Loisirs B", color: "#654321" },
                suggestedNature: null,
            },
        ]);
    });
});

describe("AccountLineCategorizationService.updateById", () => {
    it("rejects a poste that does not belong to the target account", async () => {
        const service = new AccountLineCategorizationService();

        const existingRule = {
            id: 12,
            accountId: 1,
            pattern: "ancien motif",
            posteId: null,
            natureId: null,
            occurrencesCount: 0,
        };

        const ruleRepo = {
            findOne: vi.fn().mockResolvedValue(existingRule),
            save: vi.fn(),
        };
        const posteRepo = {
            findOne: vi.fn().mockResolvedValue(null),
        };

        (service as unknown as { ruleRepo: typeof ruleRepo }).ruleRepo = ruleRepo;
        (service as unknown as { posteRepo: typeof posteRepo }).posteRepo = posteRepo;

        await expect(
            service.updateById(12, {
                pattern: "Nouveau motif",
                accountId: 2,
                posteId: 99,
            })
        ).rejects.toBeInstanceOf(AccountLineRuleValidationError);

        expect(posteRepo.findOne).toHaveBeenCalledWith({
            where: {
                id: 99,
                accountId: 2,
            },
        });
        expect(ruleRepo.save).not.toHaveBeenCalled();
    });
});
