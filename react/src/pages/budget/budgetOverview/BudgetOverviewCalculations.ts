import type { UnifiedBudgetLine } from "@chocosous/shared";

export interface GroupedBudgetData {
    posteLabel: string;
    posteColor: string | null;
    posteId: number | null;
    lines: UnifiedBudgetLine[];
    creditTotal: number;
    debitTotal: number;
    flowTotal: number;
    netTotal: number;
    flowSharePercentage: number;
    creditSharePercentage: number;
    debitSharePercentage: number;
}

export interface BudgetOverviewTotals {
    netTotal: number;
    creditTotal: number;
    debitTotal: number;
    volumeTotal: number;
}

export interface BudgetOverviewData {
    groupedData: GroupedBudgetData[];
    totals: BudgetOverviewTotals;
}

export function buildBudgetOverviewData(lines: UnifiedBudgetLine[]): BudgetOverviewData {
    const totals = lines.reduce<BudgetOverviewTotals>((currentTotals, line) => {
        const credit = Number(line.credit ?? 0);
        const debit = Number(line.debit ?? 0);

        return {
            netTotal: currentTotals.netTotal + Number(line.amount ?? 0),
            creditTotal: currentTotals.creditTotal + credit,
            debitTotal: currentTotals.debitTotal + debit,
            volumeTotal: currentTotals.volumeTotal + credit + debit,
        };
    }, {
        netTotal: 0,
        creditTotal: 0,
        debitTotal: 0,
        volumeTotal: 0,
    });

    const posteMap = new Map<string, UnifiedBudgetLine[]>();

    for (const line of lines) {
        const posteKey = `${line.posteId ?? "null"}:${line.posteLabel ?? "Sans poste"}`;
        const current = posteMap.get(posteKey) ?? [];
        current.push(line);
        posteMap.set(posteKey, current);
    }

    const groupedData = Array.from(posteMap.values())
        .map((posteLines) => {
            const firstLine = posteLines[0]!;
            const netTotal = posteLines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
            const creditTotal = posteLines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
            const debitTotal = posteLines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
            const flowTotal = creditTotal + debitTotal;
            const flowSharePercentage = totals.volumeTotal > 0 ? (flowTotal / totals.volumeTotal) * 100 : 0;
            const creditSharePercentage = totals.creditTotal > 0 ? (creditTotal / totals.creditTotal) * 100 : 0;
            const debitSharePercentage = totals.debitTotal > 0 ? (debitTotal / totals.debitTotal) * 100 : 0;

            return {
                posteLabel: firstLine.posteLabel || "Sans poste",
                posteColor: firstLine.posteColor,
                posteId: firstLine.posteId,
                lines: posteLines,
                creditTotal,
                debitTotal,
                flowTotal,
                netTotal,
                flowSharePercentage,
                creditSharePercentage,
                debitSharePercentage,
            };
        })
        .sort((a, b) => a.posteLabel.localeCompare(b.posteLabel));

    return { groupedData, totals };
}

export function getBudgetLineWeight(line: UnifiedBudgetLine, group: GroupedBudgetData): number {
    const lineVolume = Number(line.credit ?? 0) + Number(line.debit ?? 0);

    return group.flowTotal > 0 ? (lineVolume / group.flowTotal) * 100 : 0;
}