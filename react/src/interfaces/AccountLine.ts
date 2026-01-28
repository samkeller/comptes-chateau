import { parseDateToDisplay } from "../Utils/DatesUtils"
import { AccountLineNature } from "./AccountLineNature"
import { AccountLinePoste } from "./AccountLinePoste"

class AccountLine {
    id: number = 0
    dateOperation: Date = new Date()
    dateValeur: Date | null = null
    operation: string | null = ""
    nature: AccountLineNature | null = null
    poste: AccountLinePoste | null = null
    solde: number = 0
    isHorsCB: boolean = false

    constructor(accountLine: Partial<AccountLine>) {
        Object.assign(this, accountLine)
        // Convertir les dates ISO en objets Date
        if (accountLine.dateOperation) {
            this.dateOperation = new Date(accountLine.dateOperation)
        }
        if (accountLine.dateValeur) {
            this.dateValeur = new Date(accountLine.dateValeur)
        }
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
}


export default AccountLine