import { EntityManager, LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { RecurringExpense, RecurringExpenseFrequency } from "../entities/RecurringExpense";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import UserXpService from "../../core/services/UserXpService";
import { SaveRecurringExpensePayload } from "@chocosous/shared";

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

    async getById(accountId: number, id: number) {
        return this.recurringExpenseRepo.findOne({
            where: { id, accountId },
            relations: ['nature', 'poste']
        })
    }

    async getAllRecurringExpensesBefore(date: Date) {
        return await this.recurringExpenseRepo.find({
            where: {
                nextOccurrence: LessThanOrEqual(date),
                isActive: true
            },
            relations: ['nature', 'poste', 'account']
        });
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
            // Le contrat partagé décrit la fréquence en union de chaînes ; les valeurs sont identiques à l'enum backend.
            frequency: expense.frequency as unknown as RecurringExpenseFrequency,
            nextOccurrence: normalizeApiDateInput(expense.nextOccurrence) ?? undefined,
        });

        if (isCreation && typeof creatorId === "number") {
            await this.userXpService.addXPForUser(creatorId, "ACCOUNT_RECURRING_EXPENSE_CREATED");
        }

        return savedExpense;
    }
}

