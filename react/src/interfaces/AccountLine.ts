import { parseDateToDDMMYYYY } from "../Utils/DatesUtils"
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
}

export default AccountLine