import axios from "axios"
import AccountLine from "../interfaces/AccountLine"

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
        return axios.post(this.apiUrl + "operation/", accountLine).then(response => {
            return new AccountLine(response.data)
        })
    }
}

export default AccountingService