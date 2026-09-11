import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { RecurringExpense, RecurringExpenseFrequency } from "../entities/RecurringExpense";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import UserXpService from "../../core/services/UserXpService";
import { SaveRecurringExpensePayload } from "@chocosous/shared";
import { addMonths, addWeeks, addYears } from "date-fns";

export default class RecurringExpenseService {
    private recurringExpenseRepo;

    private userXpService: UserXpService;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.recurringExpenseRepo = manager.getRepository(RecurringExpense)
        this.userXpService = new UserXpService(manager);
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
    * @example
    * const futureRecurrent = [
    *     { nextOccurrence: "new Date()", solde: -100, frequency: RecurringExpenseFrequency.MONTHLY }
    * ];
    * const toDate = new Date("dans trois ans");
    * const total = simulateFutureRecurrent(futureRecurrent, toDate);
    * -> Total: -3600
    * @param futureRecurrent 
    * @param toDate 
    * @returns 
    */
    async simulateFutureRecurrent(accountId: number, toDate: Date) {
        const futureRecurrent = await this.getFutureActiveRecurrent(accountId, new Date());

        return futureRecurrent.reduce((acc, item) => {
            const amount = Number(item.solde);

            if (!Number.isFinite(amount)) {
                return acc;
            }

            const itemAmount = Math.abs(amount);
            const signMultiplier = amount < 0 ? 1 : -1;

            let occurrenceDate = new Date(item.nextOccurrence);
            let occurrencesCount = 0;

            while (occurrenceDate <= toDate) {
                occurrencesCount++;

                switch (item.frequency) {
                    case RecurringExpenseFrequency.WEEKLY:
                        occurrenceDate = addWeeks(occurrenceDate, 1);
                        break;
                    case RecurringExpenseFrequency.MONTHLY:
                        occurrenceDate = addMonths(occurrenceDate, 1);
                        break;
                    case RecurringExpenseFrequency.QUARTERLY:
                        occurrenceDate = addMonths(occurrenceDate, 3);
                        break;
                    case RecurringExpenseFrequency.YEARLY:
                        occurrenceDate = addYears(occurrenceDate, 1);
                        break;
                    default:
                        throw new Error(`Unsupported recurring expense frequency: ${item.frequency}`,);
                }
            }
            return acc + signMultiplier * amount * occurrencesCount;
        }, 0);
    }
}

