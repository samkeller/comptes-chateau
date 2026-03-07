import AccountLine from "../../interfaces/AccountLine";
import { BanquePostaleCsvData } from "../../utils/banquePostaleCsv";

export interface BanquePostaleImportAppliedMatch {
    amount: number;
    csvDateOperation: Date;
    operationId: number;
}

export interface BanquePostaleImportAmbiguity {
    amount: number;
    csvCount: number;
    operationCount: number;
}

export interface BanquePostaleImportReport {
    csvOperationCount: number;
    appliedMatches: BanquePostaleImportAppliedMatch[];
    ambiguities: BanquePostaleImportAmbiguity[];
}

export interface BanquePostalePrefillResult {
    report: BanquePostaleImportReport;
    selectedOperationIds: Set<number>;
    draftDatesById: Record<number, Date>;
}

/**
 * Le montant semble ce qui se prete le mieux pour faire le lien entre les operations du CSV et celles de l'application.
 * Cette fonction groupe les items par montant, en arrondissant a 2 decimales pour eviter les problemes d'imprecision des nombres a virgule flottante.
 * @param items 
 * @param amountResolver 
 * @returns 
 */
function groupByAmount<T>(items: T[], amountResolver: (item: T) => number): Map<string, T[]> {
    const grouped = new Map<string, T[]>();

    items.forEach((item) => {
        const amount = amountResolver(item).toFixed(2);
        const key = amount.toString();
        const existing = grouped.get(key) ?? [];
        existing.push(item);
        grouped.set(key, existing);
    });

    return grouped;
}

export function buildBanquePostalePrefillResult(
    csvData: BanquePostaleCsvData,
    operations: AccountLine[]
): BanquePostalePrefillResult {
    const csvByAmount = groupByAmount(csvData.operations, (operation) => operation.amount);
    const operationsByAmount = groupByAmount(operations, (operation) => operation.total);

    const selectedOperationIds = new Set<number>();
    const draftDatesById: Record<number, Date> = {};
    const appliedMatches: BanquePostaleImportAppliedMatch[] = [];
    const ambiguities: BanquePostaleImportAmbiguity[] = [];

    csvByAmount.forEach((csvEntries, amountKey) => {
        const operationEntries = operationsByAmount.get(amountKey) ?? [];
        const amount = Number(amountKey);

        if (csvEntries.length === 1 && operationEntries.length === 1) {
            const csvEntry = csvEntries[0];
            const matchedOperation = operationEntries[0];

            selectedOperationIds.add(matchedOperation.id);
            draftDatesById[matchedOperation.id] = csvEntry.dateOperation;
            appliedMatches.push({
                amount,
                csvDateOperation: csvEntry.dateOperation,
                operationId: matchedOperation.id
            });
            return;
        }

        if (operationEntries.length === 0) {
            return;
        }

        ambiguities.push({
            amount,
            csvCount: csvEntries.length,
            operationCount: operationEntries.length
        });
    });

    return {
        report: {
            csvOperationCount: csvData.operations.length,
            appliedMatches,
            ambiguities
        },
        selectedOperationIds,
        draftDatesById
    };
}
