import { AccountLineNature } from "./AccountLineNature"
import { AccountLinePoste } from "./AccountLinePoste"

class RecurringExpense {
    id: number = 0
    label: string = ""
    solde: number = 0
    isActive: boolean = true
    nature: AccountLineNature | null = null
    poste: AccountLinePoste | null = null
    nextOccurrence: Date = new Date()
    frequency: "monthly" = "monthly"

    constructor(recurringExpense: Partial<RecurringExpense>) {
        Object.assign(this, recurringExpense)

        // Convertir les dates ISO en objets Date
        if (recurringExpense.nextOccurrence) {
            this.nextOccurrence = new Date(recurringExpense.nextOccurrence)
        }
    }
}

export default RecurringExpense
