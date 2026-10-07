/**
 * Extrait la date plausible la plus tardive d'un texte OCR (DLC, DDM, EXP, BB…).
 * Les années courtes désignent 2000–2099 ; un mois seul expire en fin de mois.
 * Les dates sont locales, sans conversion UTC, et limitées à -1/+15 ans.
 */
export function parseExpirationDateFromText(text: string, now: Date = new Date()): Date | null {
    if (!Number.isFinite(now.getTime())) return null;

    const normalized = text.replace(/[Oo]/g, "0").replace(/[Il]/g, "1");
    const shortNumber = String.raw`\d(?:[ \t]*\d)?`;
    const year = String.raw`(?:\d(?:[ \t]*\d){3}|\d[ \t]*\d)`;
    const separator = String.raw`[ \t]*[/.-][ \t]*`;
    // Une seule alternative consomme toute la date : une DLC invalide ne devient pas un mois valide.
    const pattern = new RegExp(
        String.raw`(?<![\p{L}\p{N}/.-])(${shortNumber})${separator}(?:(${shortNumber})${separator}(${year})|(${year}))(?!\d|[ \t]*[/.-][ \t]*\d|\p{L})`,
        "gu",
    );
    const earliest = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const latest = new Date(now.getFullYear() + 15, now.getMonth(), now.getDate());
    let detected: Date | null = null;

    for (const match of normalized.matchAll(pattern)) {
        const number = (value: string): number => Number(value.replace(/[ \t]/g, ""));
        const month = number(match[2] ?? match[1]);
        const rawYear = number(match[3] ?? match[4]);
        const fullYear = rawYear < 100 ? 2000 + rawYear : rawYear;
        if (month < 1 || month > 12) continue;
        const day = match[2] ? number(match[1]) : new Date(fullYear, month, 0).getDate();
        const candidate = new Date(fullYear, month - 1, day);
        if (candidate.getFullYear() !== fullYear || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) continue;
        if (candidate < earliest || candidate > latest) continue;
        if (!detected || candidate > detected) detected = candidate;
    }

    return detected;
}
