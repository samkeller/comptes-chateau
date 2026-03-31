import axios from "axios";
import BaseService from "./BaseService";
import { BudgetItem } from "../interfaces/BudgetItem";

class BudgetService extends BaseService {
    /**
     * Get budget items for a specific account.
     * @param accountId - The account ID
     */
    getAccountBudgetItems(accountId: number): Promise<BudgetItem[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/budget`).then((response) => response.data);
    }
}

export default BudgetService;
