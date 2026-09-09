import { describe, expect, it } from "vitest";
import BanquePostaleImportResult from "./BanquePostaleImportResult";

const candidate = {
    id: 12,
    accountId: 3,
    compositeExternalId: "3|2026-09-08|LOYER|-850",
    dateOperation: "2026-09-08",
    label: "LOYER",
    amount: -850,
    rowNumber: 8,
    metadata: {
        accountNumber: "1234",
        type: "CCP",
        balance: 1200,
        exportDate: "2026-09-09"
    }
};

describe("BanquePostaleImportResult", () => {
    it("converts nested matching candidate dates", () => {
        const result = new BanquePostaleImportResult({
            linesProcessed: 2,
            linesCreated: 2,
            linesSkipped: 0,
            matched: [{ type: "matched", accountLineId: 40, candidate }],
            ambiguous: [{
                type: "ambiguous",
                accountLineId: 41,
                candidates: [{ ...candidate, id: 13 }]
            }]
        });

        expect(result.matched[0].candidate.dateOperation?.getFullYear()).toBe(2026);
        expect(result.matched[0].candidate.dateOperation?.getMonth()).toBe(8);
        expect(result.matched[0].candidate.dateOperation?.getDate()).toBe(8);
        expect(result.ambiguous[0].candidates[0].dateOperation?.getDate()).toBe(8);
    });
});