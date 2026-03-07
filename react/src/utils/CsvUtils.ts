/**
 * Parse une ligne CSV en tenant compte des champs entre guillemets et des délimiteurs.
 * @param line La ligne CSV à parser.
 * @param delimiter Le délimiteur utilisé dans le CSV (par défaut ";").
 * @returns Un tableau de chaînes représentant les champs de la ligne CSV.
 */
export function splitCsvLine(line: string, delimiter: string = ";"): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
            const nextChar = line[index + 1];
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
                continue;
            }
            inQuotes = !inQuotes;
            continue;
        }

        if (char === delimiter && !inQuotes) {
            fields.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    fields.push(current.trim());

    return fields;
}

/**
 * Tente de décoder un buffer en utilisant d'abord l'encodage principal, puis un encodage de secours si des caractères invalides sont détectés.
 * @param buffer Le buffer à décoder.
 * @param primaryEncoding L'encodage principal à utiliser (par défaut "utf-8").
 * @param fallbackEncoding L'encodage de secours à utiliser si des caractères invalides sont détectés (par défaut "windows-1252").
 * @returns Le texte décodé.
 */
export function decodeTextWithFallback(
    buffer: ArrayBuffer,
    primaryEncoding: string = "utf-8",
    fallbackEncoding: string = "windows-1252"
): string {
    const decodedPrimaryText = new TextDecoder(primaryEncoding).decode(buffer);
    if (!decodedPrimaryText.includes("\uFFFD")) {
        return decodedPrimaryText;
    }

    try {
        return new TextDecoder(fallbackEncoding).decode(buffer);
    } catch {
        return decodedPrimaryText;
    }
}
