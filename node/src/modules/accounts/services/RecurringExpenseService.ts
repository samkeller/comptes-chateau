import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { RecurringExpense, RecurringExpenseDaysCount, RecurringExpenseFrequency } from "../entities/RecurringExpense";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import UserXpService from "../../core/services/UserXpService";
import { SaveRecurringExpensePayload } from "@chocosous/shared";
import { differenceInDays, toDate } from "date-fns";

export default class RecurringExpenseService {
    private recurringExpenseRepo;

    private userXpService = new UserXpService();

    constructor(manager?: EntityManager) {
        this.recurringExpenseRepo = manager ?
            manager.getRepository(RecurringExpense) :
            AppDataSource.getRepository(RecurringExpense);

    }

    /**
     * 
     * @param accountId 
     * @param isActive Filtre pour ne récupérer que les dépenses récurrentes actives si défini.
     * @returns 
     */
    async getAllRecurringExpenses(accountId: number, isActive?: boolean) {
        return this.recurringExpenseRepo.find({
            where: {
                accountId,
                ...(isActive !== undefined ? { isActive } : {})
            },
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

    /**
     * Récupère les dépenses récurrentes futures pour un compte donné à partir d'une date spécifiée.
     * @param accountId 
     * @param fromDate 
     * @returns 
     */

    async getFutureActiveRecurrent(accountId: number, fromDate: Date): Promise<RecurringExpense[]> {
        return this.recurringExpenseRepo.find({
            where: {
                accountId,
                nextOccurrence: MoreThanOrEqual(fromDate),
                isActive: true
            },
        });
    }

    /**
    * Dans le cas d'un calcul futur de récurrence, cette fonction simule le montant total des dépenses récurrentes jusqu'à une date donnée.
    * @example
    * const futureRecurrent = [
    *     { nextOccurrence: "new Date()", solde: 100, frequency: RecurringExpenseFrequency.MONTHLY }
    * ];
    * const toDate = new Date("dans trois mois");
    * const total = simulateFutureRecurrent(futureRecurrent, toDate);
    * -> Total: 300
    * @param futureRecurrent 
    * @param toDate 
    * @returns 
    */
    async simulateFutureRecurrent(accountId: number, toDate: Date) {
        const futureRecurrent = await this.getFutureActiveRecurrent(accountId, new Date());

        return futureRecurrent.reduce((acc, item) => {
            if (item.nextOccurrence > toDate) {
                return acc;
            }

            const itemAmount = Math.abs(Number(item.solde));
            const daysFromNextOccurrence = differenceInDays(toDate, item.nextOccurrence);
            const occurrencesCount = Math.floor(daysFromNextOccurrence / RecurringExpenseDaysCount[item.frequency]) + 1;
            const signMultiplier = Number(item.solde) < 0 ? 1 : -1;

            return acc + signMultiplier * itemAmount * occurrencesCount;
        }, 0);
    }
}

