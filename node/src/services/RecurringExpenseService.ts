import { EntityManager, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { RecurringExpense } from "../entities/RecurringExpense";
import { normalizeApiDateInput } from "../utils/ApiDateUtils";

export default class RecurringExpenseService {

    private recurringExpenseRepo;

    constructor(manager?: EntityManager) {
        this.recurringExpenseRepo = manager ?
            manager.getRepository(RecurringExpense) :
            AppDataSource.getRepository(RecurringExpense);

    }
    async getAllRecurringExpenses() {
        return this.recurringExpenseRepo.find({
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
        // TODO add validation (https://github.com/typestack/class-validator)
        return this.recurringExpenseRepo.save(expensesToProcess.map((expense) => (
            {
                ...expense,
                nextOccurrence: normalizeApiDateInput(expense.nextOccurrence) ?? undefined,
            }
        )))
    }

    async save(expenseToProcess: Partial<RecurringExpense>) {
        // TODO add validation (https://github.com/typestack/class-validator)
        return this.recurringExpenseRepo.save((
            {
                ...expenseToProcess,
                nextOccurrence: normalizeApiDateInput(expenseToProcess.nextOccurrence) ?? undefined,
            }
        ))
    }
}

