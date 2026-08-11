import { EntityManager, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { RecurringExpense } from "../entities/RecurringExpense";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import UserXpService from "../../core/services/UserXpService";
import { SaveRecurringExpensePayload } from "../dto/RecurringExpenseDtos";

export default class RecurringExpenseService {

    private recurringExpenseRepo;

    private userXpService = new UserXpService();

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
            relations: ['nature', 'poste', 'account']
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

    async save(expense: SaveRecurringExpensePayload, accountId: number, creatorId?: number) {
        const isCreation = !(typeof expense.id === "number" && expense.id > 0);

        const savedExpense = await this.recurringExpenseRepo.save({
            ...expense,
            accountId,
            nextOccurrence: normalizeApiDateInput(expense.nextOccurrence) ?? undefined,
        });

        if (isCreation && typeof creatorId === "number") {
            await this.userXpService.addXPForUser(creatorId, "ACCOUNT_RECURRING_EXPENSE_CREATED");
        }

        return savedExpense;
    }
}

