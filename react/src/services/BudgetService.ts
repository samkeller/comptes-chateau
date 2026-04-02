import axios from "axios";
import BaseService from "./BaseService";
import { BudgetItem, SaveBudgetItemPayload, UnifiedBudgetLine } from "../interfaces/BudgetItem";
import { showGlobalToast } from "./GlobalToast";

class BudgetService extends BaseService {
    /**
     * Get budget items for a specific account.
     * @param accountId - The account ID
     */
    getAccountBudgetItems(accountId: number): Promise<BudgetItem[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/budget`).then((response) => response.data);
    }

    createAccountBudgetItem(accountId: number, payload: SaveBudgetItemPayload): Promise<BudgetItem> {
        return axios.post(`${this.apiUrl}/accounts/${accountId}/budget`, payload).then((response) => response.data);
    }

    updateAccountBudgetItem(accountId: number, id: number, payload: SaveBudgetItemPayload): Promise<BudgetItem> {
        return axios.put(`${this.apiUrl}/accounts/${accountId}/budget/${id}`, payload).then((response) => response.data);
    }

    deleteAccountBudgetItem(accountId: number, id: number): Promise<void> {
        return axios.delete(`${this.apiUrl}/accounts/${accountId}/budget/${id}`).then(() => {
            showGlobalToast({
                severity: "success",
                summary: "Succès",
                detail: "Ligne de budget supprimée avec succès.",
            });
        });
    }

    /**
     * Get unified budget view (budget items + recurring expenses combined).
     * @param accountId - The account ID
     */
    getUnifiedBudget(accountId: number): Promise<UnifiedBudgetLine[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/budget/unified`).then((response) => response.data);
    }
}

export default BudgetService;
