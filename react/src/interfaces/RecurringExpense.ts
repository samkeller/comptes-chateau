import { AccountLineNature } from "./AccountLineNature"
import { AccountLinePoste } from "./AccountLinePoste"
import { parseApiDate } from "../utils/DatesUtils"

export type RecurringExpenseFrequency = "weekly" | "monthly" | "quarterly" | "yearly"

class RecurringExpense {
    id: number = 0
    label: string = ""
    solde: number = 0
    isActive: boolean = true
    nature: AccountLineNature | null = null
    natureId: number | null = null;
    poste: AccountLinePoste | null = null
    posteId: number | null = null;
    nextOccurrence: Date = new Date()
    frequency: RecurringExpenseFrequency = "monthly"

    constructor(recurringExpense: Partial<RecurringExpense>) {
        Object.assign(this, recurringExpense)

        // Convertir les dates ISO en objets Date
        if (recurringExpense.nextOccurrence) {
            const parsedDate = parseApiDate(recurringExpense.nextOccurrence)
            if (parsedDate) {
                this.nextOccurrence = parsedDate
            }
        }


        // PostgreSQL numeric columns arrive as strings via the pg driver
        if (recurringExpense.solde !== undefined) {
            this.solde = Number(recurringExpense.solde)
        }
    }
}

export default RecurringExpense
