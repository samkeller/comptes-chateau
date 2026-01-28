import axios from "axios"
import AccountLine from "../interfaces/AccountLine"
import { AccountLineNature } from "../interfaces/AccountLineNature"
import { AccountLinePoste } from "../interfaces/AccountLinePoste"
import { toLocaleIsoString } from "../Utils/DatesUtils"

class BaseService {
    protected apiUrl = import.meta.env.VITE_API_URL
}

class AccountingService extends BaseService {

    getAllAccountingLines(): Promise<AccountLine[]> {
        return axios.get(this.apiUrl + "operation/").then(response => {
            return response.data.map((v: Partial<AccountLine>) => new AccountLine(v))
        })
    }

    createAccountingLine(accountLine: Partial<AccountLine>): Promise<AccountLine> {
        const dataToSend = {
            ...accountLine,
            dateOperation: accountLine.dateOperation ? toLocaleIsoString(accountLine.dateOperation) : null,
            ...(accountLine.dateValeur && { dateValeur: toLocaleIsoString(accountLine.dateValeur) })
        }

        return axios.post(this.apiUrl + "operation/", dataToSend).then(response => {
            return new AccountLine(response.data)
        })
    }

    getAllNatures(): Promise<AccountLineNature[]> {
        return axios.get(this.apiUrl + "nature/").then(response => {
            return response.data
        })
    }

    getAllPostes(): Promise<AccountLinePoste[]> {
        return axios.get(this.apiUrl + "poste/").then(response => {
            return response.data
        })
    }
}

export default AccountingService