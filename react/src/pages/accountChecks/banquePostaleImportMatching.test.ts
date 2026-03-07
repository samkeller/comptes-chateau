import { describe, expect, it } from "vitest";
import AccountLine from "../../interfaces/AccountLine";
import { BanquePostaleCsvData } from "../../utils/banquePostaleCsv";
import { buildBanquePostalePrefillResult } from "./banquePostaleImportMatching";

function buildLine(input: Partial<AccountLine>): AccountLine {
    return new AccountLine({
        id: 0,
        label: "op",
        debit: 0,
        credit: 0,
        dateOperation: new Date("2026-03-01"),
        ...input
    });
}

describe("buildBanquePostalePrefillResult", () => {
    it("prefills only strict 1:1 amount matches", () => {
        const csvData: BanquePostaleCsvData = {
            accountNumber: "224",
            type: "CCP",
            exportDate: new Date("2026-03-07"),
            balance: 0,
            operations: [
                {
                    dateOperation: new Date("2026-03-06"),
                    label: "A",
                    amount: -92.81,
                    rowNumber: 8
                },
                {
                    dateOperation: new Date("2026-03-05"),
                    label: "B",
                    amount: -10,
                    rowNumber: 9
                },
                {
                    dateOperation: new Date("2026-03-04"),
                    label: "C",
                    amount: -20,
                    rowNumber: 10
                }
            ]
        };

        const accountLines = [
            buildLine({ id: 1, debit: 92.81, credit: 0, dateOperation: new Date("2026-03-03") }),
            buildLine({ id: 2, debit: 10, credit: 0, dateOperation: new Date("2026-03-02") }),
            buildLine({ id: 3, debit: 10, credit: 0, dateOperation: new Date("2026-03-01") })
        ];

        const result = buildBanquePostalePrefillResult(csvData, accountLines);

        expect(result.selectedOperationIds.has(1)).toBe(true);
        expect(result.selectedOperationIds.size).toBe(1);
        expect(result.draftDatesById[1]).toEqual(new Date("2026-03-06"));

        expect(result.report.appliedMatches).toHaveLength(1);
        expect(result.report.ambiguities).toHaveLength(1);
        expect(result.report.ambiguities[0].amount).toBe(-10);
    });
});
