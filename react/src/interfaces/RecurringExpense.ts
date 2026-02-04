import { AccountLineNature } from "./AccountLineNature"
import { AccountLinePoste } from "./AccountLinePoste"

class RecurringExpense {
    id: number = 0
    label: string = ""
    solde: number = 0
    isActive: boolean = true
    nature: AccountLineNature | null = null
    poste: AccountLinePoste | null = null

    constructor(recurringExpense: Partial<RecurringExpense>) {
        Object.assign(this, recurringExpense)
    }
}

export default RecurringExpense
