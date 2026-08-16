import { describe, expect, it } from "vitest";
import { normalizeAccountLineRuleLabel, normalizeForMatching } from "./AccountLineRulesUtils";

/**
 * Règles de normalization des libellés :
 * - Mettre en minuscule et capitaliser la première lettre
 * - Remplacer les espaces multiples par un seul espace
 * - Retourner null pour les chaînes vides ou ne contenant que des espaces
 */
describe("AccountLineCategorizationService.getUnmapped", () => {

    /**
     * - bonjour -> Bonjour
     * - BONJOUR -> Bonjour
     * - bONjOuR -> Bonjour
     * - Bonjour -> Bonjour
     * - bonjour monde -> Bonjour monde
     * - BONJOUR MONDE -> Bonjour monde
     */
    it("returns full LowerCase with first letter capitalized", () => {
        expect(normalizeAccountLineRuleLabel("bonjour")).toBe("Bonjour");
        expect(normalizeAccountLineRuleLabel("BONJOUR")).toBe("Bonjour");
        expect(normalizeAccountLineRuleLabel("bONjOuR")).toBe("Bonjour");
        expect(normalizeAccountLineRuleLabel("Bonjour")).toBe("Bonjour");
        expect(normalizeAccountLineRuleLabel("bonjour monde")).toBe("Bonjour monde");
        expect(normalizeAccountLineRuleLabel("BONJOUR MONDE")).toBe("Bonjour monde");
    })

    /**
    * Chaînes vides ou ne contenant que des espaces :
    * - "   " -> throw
    * - "" -> throw
    * - null -> throw
    * - undefined -> throw
     */
    it("returns null for empty or whitespace-only strings", () => {
        expect(() => normalizeAccountLineRuleLabel("   ")).toThrow("Le libellé normalisé ne peut pas être vide.");
        expect(() => normalizeAccountLineRuleLabel("")).toThrow("Le libellé ne peut pas être vide.");
        expect(() => normalizeAccountLineRuleLabel(null as any)).toThrow("Le libellé ne peut pas être vide.");
        expect(() => normalizeAccountLineRuleLabel(undefined as any)).toThrow("Le libellé ne peut pas être vide.");
    })

    /**
     * Espaces :
     * - " abc " -> "abc"
     * - "   abc   " -> "abc"
     * - "\tabc\t" -> "abc"
     * - " abc   def " -> "abc def"
     */
    it("trims leading and trailing whitespace", () => {
        expect(normalizeAccountLineRuleLabel(" abc ")).toBe("Abc");
        expect(normalizeAccountLineRuleLabel("   abc   ")).toBe("Abc");
        expect(normalizeAccountLineRuleLabel("\tabc\t")).toBe("Abc");
        expect(normalizeAccountLineRuleLabel(" abc   def ")).toBe("Abc def");
    })

    /**
     * Nombres :
     * - "123" -> "123"
     * - "abc123" -> "Abc123"
     */
    it("keeps numbers intact", () => {
        expect(normalizeAccountLineRuleLabel("123")).toBe("123");
        expect(normalizeAccountLineRuleLabel("abc123")).toBe("Abc123");
    })

    /**
     * Accents et caractères spéciaux :
     * - café -> Café
     * - CAFÉ -> Café
     * - école -> École
     * - déjà vu -> Déjà vu
     * - Noël -> Noël
     */
    it("handles accents and special characters", () => {
        expect(normalizeAccountLineRuleLabel("café")).toBe("Café");
        expect(normalizeAccountLineRuleLabel("CAFÉ")).toBe("Café");
        expect(normalizeAccountLineRuleLabel("école")).toBe("École");
        expect(normalizeAccountLineRuleLabel("déjà vu")).toBe("Déjà vu");
        expect(normalizeAccountLineRuleLabel("Noël")).toBe("Noël");
    });

    /**
     * Ponctuation :
     * - "bonjour!" -> "Bonjour!"
     * - " hello, world " -> "Hello, world"
     * - "test..." -> "Test..."
     */
    it("handles punctuation correctly", () => {
        expect(normalizeAccountLineRuleLabel("bonjour!")).toBe("Bonjour!");
        expect(normalizeAccountLineRuleLabel(" hello, world ")).toBe("Hello, world");
        expect(normalizeAccountLineRuleLabel("test...")).toBe("Test...");
    });

    /**
     * Espaces internes :
     * - "bonjour   monde" -> "Bonjour monde"
     * - "bonjour\tmonde" -> "Bonjour monde"
     */
    it("handles internal whitespace correctly", () => {
        expect(normalizeAccountLineRuleLabel("   bonjour   monde")).toBe("Bonjour monde");
        expect(normalizeAccountLineRuleLabel("bonjour   monde   ")).toBe("Bonjour monde");
        expect(normalizeAccountLineRuleLabel("     bonjour   monde   ")).toBe("Bonjour monde");
        expect(normalizeAccountLineRuleLabel("bonjour   monde")).toBe("Bonjour monde");
        expect(normalizeAccountLineRuleLabel("bonjour\tmonde")).toBe("Bonjour monde");
    });

    /**
     * Cas particuliers :
     * - "a" -> "A"
     * - "é" -> "É"
     * - "à propos" -> "À propos"
     * - "iPhone" -> "Iphone" (décider si attendu ou non)
     * - "McDonald's" -> "McDonald's" (décider si attendu ou non)
     */
    it("handles special cases correctly", () => {
        expect(normalizeAccountLineRuleLabel("a")).toBe("A");
        expect(normalizeAccountLineRuleLabel("é")).toBe("É");
        expect(normalizeAccountLineRuleLabel("à propos")).toBe("À propos");
        expect(normalizeAccountLineRuleLabel("iPhone")).toBe("Iphone");
        expect(normalizeAccountLineRuleLabel("McDonald's")).toBe("Mcdonald's");
    })

    /**
     *  * Idempotence :
     * - normalizer(normalizer("bonjour")) === normalizer("bonjour")
     * - normalizer(normalizer("  café  ")) === normalizer("café")
     * - normalizer(normalizer("bonjour   monde")) === normalizer("bonjour monde")
     * - normalizer(normalizer("bonjour!")) === normalizer("bonjour!")
     * - normalizer(normalizer("   bonjour   monde")) === normalizer("bonjour monde")
     */
    it("is idempotent", () => {
        const testCases = [
            "bonjour",
            "  café  ",
            "bonjour   monde",
            "bonjour!",
            "   bonjour   monde"
        ];

        for (const testCase of testCases) {
            const firstNormalization = normalizeAccountLineRuleLabel(testCase);
            const secondNormalization = normalizeAccountLineRuleLabel(firstNormalization);
            expect(secondNormalization).toBe(firstNormalization);
        }
    });

});

describe("AccountLineCategorizationService.normalizeForMatching", () => {

    it("returns null for empty or whitespace-only strings", () => {
        expect(normalizeForMatching("   ")).toBe(null);
        expect(normalizeForMatching("")).toBe(null);
        expect(normalizeForMatching(null)).toBe(null);
        expect(normalizeForMatching(undefined)).toBe(null);
    })

    it("normalizes strings for matching", () => {
        const testCasesThatShouldBeEqual1 = [
            "bonjour",
            "BONJOUR",
            "bONjOuR",
            "Bonjour",
        ];

        for (const testCase of testCasesThatShouldBeEqual1) {
            const normalized = normalizeForMatching(testCase);
            expect(normalized).toBe("bonjour");
        }

        const testCasesThatShouldBeEqual2 = [
            "Café Paris",
            "CAFE PARIS",
            "Cafe   Paris",
            " café paris ",


        ];
        for (const testCase of testCasesThatShouldBeEqual2) {
            const normalized = normalizeForMatching(testCase);
            expect(normalized).toBe("cafe paris");
        }
    })

    it("removes diacritics for matching", () => {
        const testCases = [
            "Café",
            "Cafe",
            "CAFÉ",
            "café", // é (important en Unicode)
        ];

        for (const testCase of testCases) {
            expect(normalizeForMatching(testCase)).toBe("cafe");
        }
    });
})
