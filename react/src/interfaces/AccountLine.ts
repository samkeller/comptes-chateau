import { parseDateToDDMMYYYY, parseDateToDisplay,  parsePostgresToDate } from "../Utils/DatesUtils"
import AccountLineNature from "./enums/AccountLineNature"
import AccountLinePoste from "./enums/AccountLinePoste"

class AccountLine {
    id: number = 0
    dateOperation: string = parseDateToDDMMYYYY(new Date())
    dateValeur: string | null = null
    operation: string | null = ""
    nature: AccountLineNature = AccountLineNature.UNKNOWN
    poste: AccountLinePoste = AccountLinePoste.UNKNOWN
    solde: number = 0
    isHorsCB: boolean = false

    constructor(accountLine: Partial<AccountLine>) {
        Object.assign(this, accountLine)
    }

    public getDisplayDateValeur(): string {
        if (this.dateValeur === null || !this.dateValeur) {
            return ""
        } else {
            return parseDateToDisplay(parsePostgresToDate(this.dateValeur))
        }
    }

    public getDisplayDateOperation(): string {
        return parseDateToDisplay(parsePostgresToDate(this.dateOperation))
    }
}


export default AccountLine