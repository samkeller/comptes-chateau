/**
 * Extrait la date de péremption d'un texte OCR (DLC, DDM, EXP, BB…), même noyée dans d'autres textes.
 * Les dates précédées d'une mention de péremption sont prioritaires ; à défaut, la plus tardive l'emporte.
 * Formats : JJ/MM/AA(AA), MM/AA(AA), AAAA-MM-JJ et mois en lettres (31 DEC 2026, DÉC. 26).
 * Les années courtes désignent 2000–2099 ; un mois seul expire en fin de mois.
 * Les dates sont locales, sans conversion UTC, et limitées à -1/+15 ans.
 */
export function parseExpirationDateFromText(text: string, now: Date = new Date()): Date | null {
    if (!Number.isFinite(now.getTime())) return null;

    // Les confusions OCR (O→0, I/l→1) ne sont corrigées qu'au contact de chiffres : les mots restent lisibles.
    const normalized = text.replace(
        /[OoIl](?=[OoIl\d \t/.-]*\d)|(?<=\d)[OoIl]/g,
        character => /[Oo]/.test(character) ? "0" : "1",
    );
    const earliest = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const latest = new Date(now.getFullYear() + 15, now.getMonth(), now.getDate());
    const labelEnds = [...normalized.matchAll(EXPIRY_LABEL)].map(match => match.index + match[0].length);
    const candidates: { date: Date; labeled: boolean }[] = [];

    const addCandidate = (start: number, rawYear: number, month: number, day: number | null): void => {
        const fullYear = rawYear < 100 ? 2000 + rawYear : rawYear;
        if (month < 1 || month > 12) return;
        const resolvedDay = day ?? new Date(fullYear, month, 0).getDate();
        const date = new Date(fullYear, month - 1, resolvedDay);
        if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== resolvedDay) return;
        if (date < earliest || date > latest) return;
        const gluedPrefix = /\p{L}+$/u.exec(normalized.slice(Math.max(0, start - 12), start))?.[0];
        // Une date collée à des lettres n'est retenue que derrière une mention connue (EXP31/12/26, pas LOT31/12/26).
        if (gluedPrefix && !GLUED_LABEL.test(gluedPrefix)) return;
        const labeled = Boolean(gluedPrefix) || labelEnds.some(end => end <= start && start - end <= LABEL_MAX_DISTANCE);
        candidates.push({ date, labeled });
    };

    for (const match of normalized.matchAll(NUMERIC_DATE)) {
        const groups = match.groups ?? {};
        if (groups.isoYear) {
            addCandidate(match.index, toNumber(groups.isoYear), toNumber(groups.isoMonth), toNumber(groups.isoDay));
        } else if (groups.dmyDay) {
            addCandidate(match.index, toNumber(groups.dmyYear), toNumber(groups.dmyMonth), toNumber(groups.dmyDay));
        } else {
            addCandidate(match.index, toNumber(groups.myYear), toNumber(groups.myMonth), null);
        }
    }
    for (const match of normalized.matchAll(NAMED_MONTH_DATE)) {
        const groups = match.groups ?? {};
        const month = monthFromName(groups.month);
        if (month) addCandidate(match.index, toNumber(groups.year), month, groups.day ? toNumber(groups.day) : null);
    }

    const labeled = candidates.filter(candidate => candidate.labeled);
    const pool = labeled.length > 0 ? labeled : candidates;
    return pool.reduce<Date | null>((best, { date }) => !best || date > best ? date : best, null);
}

const LABEL_MAX_DISTANCE = 40;
const GLUED_LABEL = /^(?:EXP|DLC|DDM|DLUO|BBE?|MHD|TTH)$/iu;
const EXPIRY_LABEL = new RegExp(
    String.raw`(?<!\p{L})(?:D[ .]?L[ .]?C|D[ .]?D[ .]?M|DLUO|EXP(?:IRY|IRES?|IRATION)?|BBE|BB|BEST[ \t]*BEFORE|USE[ \t]*BY|CONSOMMER|AVANT|P[ÉE]REMPTION|MHD|TTH)(?!\p{L})`,
    "giu",
);

const SHORT_NUMBER = String.raw`\d(?:[ \t]*\d)?`;
const YEAR = String.raw`(?:\d(?:[ \t]*\d){3}|\d[ \t]*\d)`;
const SEPARATOR = String.raw`[ \t]*[\/.\-\\|][ \t]*`;
// Une seule alternative consomme toute la date : une DLC invalide ne devient pas un mois valide.
const NUMERIC_DATE = new RegExp(
    String.raw`(?<![\p{N}\/.\-\\|])(?:`
    + String.raw`(?<isoYear>\d{4})[\/.\-](?<isoMonth>\d{1,2})[\/.\-](?<isoDay>\d{1,2})`
    + String.raw`|(?<dmyDay>${SHORT_NUMBER})${SEPARATOR}(?<dmyMonth>${SHORT_NUMBER})${SEPARATOR}(?<dmyYear>${YEAR})`
    + String.raw`|(?<myMonth>${SHORT_NUMBER})${SEPARATOR}(?<myYear>${YEAR})`
    + String.raw`)(?!\d|[ \t]*[\/.\-\\|][ \t]*\d)`,
    "gu",
);

const MONTH_NAMES: [RegExp, number][] = [
    [/^jan/, 1], [/^f[ée][vb]/, 2], [/^mar/, 3], [/^(?:avr|apr)/, 4], [/^ma[iy]/, 5], [/^ju[i]?n/, 6],
    [/^ju[i]?l/, 7], [/^(?:ao[uû]|aug)/, 8], [/^sep/, 9], [/^oct/, 10], [/^nov/, 11], [/^d[ée]c/, 12],
];
const MONTH_PATTERN = String.raw`jan(?:v(?:ier)?|uary)?|f[ée]v(?:r(?:ier)?)?|feb(?:ruary)?|mar(?:s|ch)?|avr(?:il)?|apr(?:il)?|mai|may|juin|june?|juil(?:let)?|jul(?:y)?|ao[uû]t?|aug(?:ust)?|sep(?:t(?:embre|ember)?)?|oct(?:obre|ober)?|nov(?:embre|ember)?|d[ée]c(?:embre|ember)?`;
const NAMED_MONTH_DATE = new RegExp(
    String.raw`(?<![\p{L}\p{N}])(?:(?<day>\d{1,2})[ \t.\-\/]*)?(?<month>${MONTH_PATTERN})(?!\p{L})\.?[ \t.\-\/]*(?<year>\d{4}|\d{2})(?!\d)`,
    "giu",
);

function toNumber(value: string): number {
    return Number(value.replace(/[ \t]/g, ""));
}

function monthFromName(name: string): number | null {
    const lower = name.toLowerCase();
    return MONTH_NAMES.find(([pattern]) => pattern.test(lower))?.[1] ?? null;
}
