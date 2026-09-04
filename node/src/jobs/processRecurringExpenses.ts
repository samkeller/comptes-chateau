import { AccountLine, AccountLineSource } from "../modules/accounts/entities/AccountLine";
import AccountLineService from "../modules/accounts/services/AccountLineService";
import RecurringExpenseService from "../modules/accounts/services/RecurringExpenseService";
import JobExecutionLogService from "../modules/core/services/JobExecutionLogService";
import { EntityManager } from "typeorm";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export async function processRecurringExpenses(
    manager: EntityManager,
    currentDate: Date
) {
    const jobName = 'recurring-expenses-monthly';

    const recurringExpenseService = new RecurringExpenseService(manager);
    const accountLineService = new AccountLineService(manager);
    const logService = new JobExecutionLogService(manager);

    // 1 - Récupérer toutes les lignes "recurring_expense" où les dates sont inférieures ou égales à aujourd'hui
    const expensesToProcess = await recurringExpenseService.getAllRecurringExpensesBefore(currentDate);

    if (expensesToProcess.length === 0) {
        await logService.logSuccess(
            jobName,
            'No recurring expenses to process',
            { date: currentDate }
        );
        return {
            createdAccountLines: [],
            updatedRecurringExpenses: [],
            processedCount: 0
        };
    }

    // 2 - Pour chacune de ces lignes, créer une ligne "account_line"
    const accountLinesToCreate: Partial<AccountLine>[] = expensesToProcess.map(expense => ({
        id: 0,
        label: expense.label,
        debit: expense.solde < 0 ? Math.abs(expense.solde) : 0,
        credit: expense.solde > 0 ? expense.solde : 0,
        source: AccountLineSource.SYSTEM,
        dateOperation: currentDate,
        dateValeur: null,
        accountId: expense.accountId,
        account: expense.account
    }));

    const createdLines = await accountLineService.saveAll(accountLinesToCreate);

    // 3 - Modifier les recurring_expense pour mettre à jour la prochaine occurrence
    for (const expense of expensesToProcess) {
        const safeNextOccurrenceDate = new Date(expense.nextOccurrence);

        /**
         * Attention, on utilise addDays/addWeeks/addMonths/addYears pour calculer la prochaine occurrence
         * -> Evite les problèmes de safe (month+1 qui créé le 31 septembre qui n'existe pas)
         */
        switch (expense.frequency) {
            case 'weekly':
                expense.nextOccurrence = addWeeks(safeNextOccurrenceDate, 1);
                break;
            case 'monthly':
                expense.nextOccurrence = addMonths(safeNextOccurrenceDate, 1);
                break;
            case 'quarterly':
                expense.nextOccurrence = addMonths(safeNextOccurrenceDate, 3);
                break;
            case 'yearly':
                expense.nextOccurrence = addYears(safeNextOccurrenceDate, 1);
                break;
            default:
                throw new Error(`Unknown frequency: ${expense.frequency}`);
        }
    }

    const updatedRecurringExpenses = await recurringExpenseService.saveAll(expensesToProcess);

    // 4 - Créer un log de succès
    await logService.logSuccess(
        jobName,
        `Successfully created ${createdLines.length} accounting lines from recurring expenses`,
        {
            date: currentDate,
            processedExpenses: expensesToProcess.map(e => ({ id: e.id, label: e.label })),
            createdAccountLineIds: createdLines.map(l => l.id)
        }
    );
    return {
        createdAccountLines: createdLines,
        updatedRecurringExpenses,
        processedCount: createdLines.length
    };
}

