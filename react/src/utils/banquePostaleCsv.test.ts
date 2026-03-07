import { describe, expect, it } from "vitest";
import { parseBanquePostaleCsv } from "./banquePostaleCsv";

const validCsv = [
    "Numero Compte   ;2245945T038",
    "Type         ;CCP",
    "Compte tenu en  ;euros",
    "Date            ;07/03/2026",
    "Solde (EUROS)   ;-198,90",
    "",
    "Date;Libelle;Montant(EUROS)",
    "06/03/2026;ACHAT CB ZOOPLUS;-92,81",
    "05/03/2026;VIREMENT INSTANTANE;1178,00"
].join("\n");

function utf8Buffer(value: string): ArrayBuffer {
    return new TextEncoder().encode(value).buffer;
}

describe("parseBanquePostaleCsv", () => {
    it("parses Banque Postale header and operations from ArrayBuffer", () => {
        const parsed = parseBanquePostaleCsv(utf8Buffer(validCsv));

        expect(parsed.accountNumber).toBe("2245945T038");
        expect(parsed.type).toBe("CCP");
        expect(parsed.balance).toBe(-198.9);
        expect(parsed.operations).toHaveLength(2);

        expect(parsed.operations[0].amount).toBe(-92.81);
        expect(parsed.operations[0].rowNumber).toBe(7);
    });

    it("decodes windows-1252 fallback and keeps accented labels", () => {
        const bytes = new Uint8Array(utf8Buffer(validCsv));
        const tokenIndex = validCsv.indexOf("ZOOPLUS");

        expect(tokenIndex).toBeGreaterThanOrEqual(0);

        // Inject a windows-1252 byte (0xE9) to force UTF-8 replacement and fallback decoding.
        bytes[tokenIndex] = 0xe9;

        const parsed = parseBanquePostaleCsv(bytes.buffer);

        expect(parsed.operations[0].label).toContain("\u00e9");
    });

    it("throws on malformed CSV", () => {
        const malformedCsv = "Date;Libelle;Montant(EUROS)\n06/03/2026;A;-10,00";

        expect(() => parseBanquePostaleCsv(utf8Buffer(malformedCsv))).toThrow();
    });
});
