import axios from "axios";
import Account from "../interfaces/Account";
import BaseService from "./BaseService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";

class AccountService extends BaseService {
    
    private localStorageUtils = new LocalStorageUtils();
    /**
     * Get all accounts accessible to the connected user.
     */
    getAllAccounts(): Promise<Account[]> {
        // Cache en localStorage pour éviter de recharger les comptes à chaque changement de page.
        
        if (this.localStorageUtils.getAccounts().length > 0) {
            return Promise.resolve(this.localStorageUtils.getAccounts());
        }

        return axios.get(`${this.apiUrl}/accounts`).then((response) => {
            const accounts = (response.data as Partial<Account>[]).map((value) => new Account(value));
            this.localStorageUtils.setAccounts(accounts);
            return accounts;
        });
    }
}

export default AccountService;
