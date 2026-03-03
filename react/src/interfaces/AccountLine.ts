import { parseDateToDisplay } from "../utils/DatesUtils"
import { AccountLineNature } from "./AccountLineNature"
import { AccountLinePoste } from "./AccountLinePoste"

class AccountLine {
    id: number = 0
    dateOperation: Date = new Date()
    dateValeur: Date | null = null
    label: string = ""
    nature: AccountLineNature | null = null
    poste: AccountLinePoste | null = null
    debit: number = 0
    credit: number = 0
    isChecked: boolean = false
    source: "system" | "manual" | "import" | null = null
    createdAt?: Date
    updatedAt?: Date

    constructor(accountLine: Partial<AccountLine>) {
        Object.assign(this, accountLine)
        // Convertir les dates ISO en objets Date
        if (accountLine.dateOperation) {
            this.dateOperation = new Date(accountLine.dateOperation)
        }
        if (accountLine.dateValeur) {
            this.dateValeur = new Date(accountLine.dateValeur)
        }
        if (accountLine.createdAt) {
            this.createdAt = new Date(accountLine.createdAt)
        }
        if (accountLine.updatedAt) {
            this.updatedAt = new Date(accountLine.updatedAt)
        }
    }

    public get total(): number {
        return this.credit - this.debit
    }

    public get displayDateValeur(): string {
        if (this.dateValeur === null) {
            return ""
        }
        return parseDateToDisplay(this.dateValeur)
    }

    public get displayDateOperation(): string {
        return parseDateToDisplay(this.dateOperation)
    }

    public get yearMonthKey(): string {
        const year = this.dateOperation.getFullYear()
        const month = (this.dateOperation.getMonth() + 1).toString().padStart(2, "0")
        return `${year}-${month}`
    }
}


export default AccountLine