import { AccountLine, AccountLineSource } from "../modules/accounts/entities/AccountLine";
import AccountLineService from "../modules/accounts/services/AccountLineService";
import RecurringExpenseService from "../modules/accounts/services/RecurringExpenseService";
import JobExecutionLogService from "../modules/core/services/JobExecutionLogService";
import { EntityManager } from "typeorm";

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
        nature: expense.nature,
        poste: expense.poste,
        source: AccountLineSource.SYSTEM,
        dateOperation: currentDate,
        dateValeur: null,
        account: expense.account,
    }));

    const createdLines = await accountLineService.saveAll(accountLinesToCreate);

    // 3 - Modifier les recurring_expense pour mettre à jour la prochaine occurrence
    for (const expense of expensesToProcess) {
        const d = new Date(expense.nextOccurrence);
        expense.nextOccurrence = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }

    await recurringExpenseService.saveAll(expensesToProcess);

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
}

