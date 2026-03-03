import { AccountLineNature } from "./AccountLineNature"
import { AccountLinePoste } from "./AccountLinePoste"
import { parseApiDate } from "../services/ApiDateCodec"

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
            const parsedDate = parseApiDate(recurringExpense.nextOccurrence)
            if (parsedDate) {
                this.nextOccurrence = parsedDate
            }
        }
    }
}

export default RecurringExpense
