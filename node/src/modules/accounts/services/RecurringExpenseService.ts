import { EntityManager, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { RecurringExpense } from "../entities/RecurringExpense";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";

export default class RecurringExpenseService {

    private recurringExpenseRepo;

    constructor(manager?: EntityManager) {
        this.recurringExpenseRepo = manager ?
            manager.getRepository(RecurringExpense) :
            AppDataSource.getRepository(RecurringExpense);

    }
    async getAllRecurringExpenses(accountId: number) {
        return this.recurringExpenseRepo.find({
            where: { accountId },
            relations: ['nature', 'poste'],
            order: { label: 'ASC' }
        })
    }

    async getAllRecurringExpensesBefore(date: Date) {
        return this.recurringExpenseRepo.find({
            where: {
                nextOccurrence: LessThanOrEqual(date),
                isActive: true
            },
            relations: ['nature', 'poste']
        })
    }

    async saveAll(expensesToProcess: RecurringExpense[]) {
        return this.recurringExpenseRepo.save(expensesToProcess.map((expense) => (
            {
                ...expense,
                nextOccurrence: normalizeApiDateInput(expense.nextOccurrence) ?? undefined,
            }
        )))
    }

    async save(expense: Partial<RecurringExpense>, accountId: number) {
        return this.recurringExpenseRepo.save({
            ...expense,
            accountId,
            nextOccurrence: normalizeApiDateInput(expense.nextOccurrence) ?? undefined,
        });
    }
}

