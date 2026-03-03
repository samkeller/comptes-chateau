const API_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse une string de date au format ISO (YYYY-MM-DD) en un objet Date.
 * Valide que la string correspond bien au format attendu avant de tenter de la parser.
 * @param dateString La string de date au format ISO (YYYY-MM-DD)
 * @returns Un objet Date correspondant à la string de date, ou null si la string n'est pas au format attendu
 * @throws Error si la string n'est pas au format attendu
 */
export function parseApiDateString(dateString: string): Date {
    if (!API_DATE_REGEX.test(dateString)) {
        throw new Error("Invalid date format, expected YYYY-MM-DD");
    }

    const [yearString, monthString, dayString] = dateString.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);

    return new Date(year, month - 1, day);
}


/**
 * Normalise une entrée de date provenant de l'API, qui peut être une string ou un objet Date, en un objet Date ou null.
 * @param value La valeur de date à normaliser, qui peut être une string au format ISO (YYYY-MM-DD), un objet Date, ou null/undefined
 * @returns Un objet Date correspondant à la valeur d'entrée, ou null si la valeur d'entrée est null ou undefined
 * @throws Error si la valeur d'entrée est une string qui n'est pas au format attendu
 */
export function normalizeApiDateInput(value: string | Date | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    return parseApiDateString(value);
}
