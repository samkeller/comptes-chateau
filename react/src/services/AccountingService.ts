import axios from "axios"
import AccountLine from "../interfaces/AccountLine"

class BaseService {
    protected apiUrl = import.meta.env.VITE_API_URL
}
class AccountingService extends BaseService {

    getAllAccountingLines(): Promise<AccountLine[]> {
        return axios.get(this.apiUrl + "operation/").then(response => {
            console.log("response", response);
            return response.data.map((v: Partial<AccountLine>) => new AccountLine(v))
        })
    }
}

export default AccountingService