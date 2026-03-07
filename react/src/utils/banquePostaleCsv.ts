import { parseDDMMYYYYToDate } from "./DatesUtils";
import { decodeTextWithFallback, splitCsvLine } from "./CsvUtils";

export interface BanquePostaleCsvOperation {
    dateOperation: Date;
    label: string;
    amount: number;
    rowNumber: number;
}

export interface BanquePostaleCsvData {
    accountNumber: string;
    type: string;
    exportDate: Date;
    balance: number;
    operations: BanquePostaleCsvOperation[];
}

function parseFrenchAmountToNumber(rawAmount: string): number {
    const normalized = rawAmount
        .replace(/\s|\u00A0/g, "")
        .replace(",", ".");

    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) {
        throw new Error(`Montant invalide: ${rawAmount}`);
    }

    return parsed;
}

function parseDateOrThrow(rawDate: string, fieldName: string): Date {
    const parsedDate = parseDDMMYYYYToDate(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`Date invalide pour ${fieldName}: ${rawDate}`);
    }

    return parsedDate;
}


export function parseBanquePostaleCsv(csvBuffer: ArrayBuffer): BanquePostaleCsvData {
    const csvText = decodeTextWithFallback(csvBuffer);
    
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 8) {
        throw new Error("Le fichier CSV Banque Postale est incomplet.");
    }

    const parsedRows = lines.map((line) => splitCsvLine(line, ";"));

    const accountNumber = parsedRows[0]?.[1] ?? "";
    const type = parsedRows[1]?.[1] ?? "";
    const exportDateRaw = parsedRows[3]?.[1] ?? "";
    const balanceRaw = parsedRows[4]?.[1] ?? "";

    if (!accountNumber || !type || !exportDateRaw || !balanceRaw) {
        throw new Error("Entete CSV Banque Postale invalide.");
    }

    const exportDate = parseDateOrThrow(exportDateRaw, "la date d'export");
    const balance = parseFrenchAmountToNumber(balanceRaw);

    const headerIndex = parsedRows.findIndex((row) => row[0] === "Date" && row[2]?.startsWith("Montant"));
    if (headerIndex === -1) {
        throw new Error("Tableau des operations introuvable dans le CSV.");
    }

    const operations: BanquePostaleCsvOperation[] = [];

    for (let index = headerIndex + 1; index < parsedRows.length; index += 1) {
        const row = parsedRows[index];
        const rawDate = row[0] ?? "";
        const rawLabel = row[1] ?? "";
        const rawAmount = row[2] ?? "";

        if (!rawDate || !rawAmount) {
            continue;
        }

        const dateOperation = parseDateOrThrow(rawDate, `la date de l'operation ligne ${index + 1}`);
        const amount = parseFrenchAmountToNumber(rawAmount);

        operations.push({
            dateOperation,
            label: rawLabel,
            amount,
            rowNumber: index + 1
        });
    }

    return {
        accountNumber,
        type,
        exportDate,
        balance,
        operations
    };
}
