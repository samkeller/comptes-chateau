/**
 * Normalise un code-barres EAN/UPC/GTIN vers sa forme canonique utilisée en base et chez OpenFoodFacts.
 * - UPC-A (12 chiffres) → EAN-13 en préfixant `0` ;
 * - GTIN-14 commençant par `0` → EAN-13 ;
 * - EAN-8 et EAN-13 inchangés.
 *
 * @returns `null` si la valeur n'est pas un code numérique de 8 à 14 chiffres.
 */
export function normalizeBarcode(raw: string): string | null {
    const digits = raw.replace(/[\s-]/g, "");
    if (!/^\d{8,14}$/.test(digits)) return null;
    if (digits.length === 12) return `0${digits}`;
    if (digits.length === 14 && digits.startsWith("0")) return digits.slice(1);
    return digits;
}

/**
 * Formes équivalentes d'un code-barres, pour retrouver des données historiques non normalisées
 * (UPC-A sur 12 chiffres, GTIN-14 préfixé de `0`).
 */
export function barcodeVariants(raw: string): string[] {
    const normalized = normalizeBarcode(raw);
    if (!normalized) return [];
    const variants = [normalized];
    if (normalized.length === 13) {
        variants.push(`0${normalized}`);
        if (normalized.startsWith("0")) variants.push(normalized.slice(1));
    }
    return variants;
}
