import { describe, expect, it, vi } from "vitest";
import AccountLineCategorizationService from "./AccountLineCategorizationService";

type RuleRecord = { pattern: string };
type LineRecord = {
    id: number;
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
                label: "Café Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 2,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 3,
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
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 2,
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
        const { service } = createService([{ pattern: "cafe paris" }], [
            {
                id: 1,
                label: "Café Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 2,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
            {
                id: 3,
                label: "Cafe Paris",
                poste: { id: 10, label: "Loisirs", color: "#123456" },
                nature: null,
                account: { id: 1, label: "Compte courant" },
            },
        ]);

        const result = await service.getUnmapped();

        expect(result).toEqual([]);
    });
});
