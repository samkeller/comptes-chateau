import axios from "axios";
import Account from "../interfaces/Account";
import BaseService from "./BaseService";

class AccountService extends BaseService {
    /**
     * Get all accounts accessible to the connected user.
     */
    getAllAccounts(): Promise<Account[]> {
        return axios.get(`${this.apiUrl}/accounts`).then((response) => {
            return (response.data as Partial<Account>[]).map((value) => new Account(value));
        });
    }
}

export default AccountService;
