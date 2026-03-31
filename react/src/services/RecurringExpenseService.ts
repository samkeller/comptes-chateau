import axios from "axios"
import RecurringExpense from "../interfaces/RecurringExpense"
import BaseService from "./BaseService"
import { formatApiDate } from "./ApiDateCodec"

class RecurringExpenseService extends BaseService {

    /**
     * Get all recurring expenses for a specific account.
     * @param accountId - The account ID
     */
    getAccountRecurringExpenses(accountId: number): Promise<RecurringExpense[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/recurring-expenses`).then(response => {
            return response.data.map((v: Partial<RecurringExpense>) => new RecurringExpense(v))
        })
    }

    /**
     * Save (create or update) a recurring expense for a specific account.
     * @param accountId - The account ID
     * @param expense - The recurring expense data
     */
    saveAccountRecurringExpense(accountId: number, expense: Partial<RecurringExpense>): Promise<RecurringExpense> {
         const dataToSend = {
            ...expense,
                ...(expense.nextOccurrence && { nextOccurrence: formatApiDate(expense.nextOccurrence) })
        }
        
        return axios.post(`${this.apiUrl}/accounts/${accountId}/recurring-expenses/save`, dataToSend).then(response => {
            return new RecurringExpense(response.data)
        })
    }
}

export default RecurringExpenseService
