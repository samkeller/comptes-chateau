import axios from "axios"
import RecurringExpense from "../interfaces/RecurringExpense"
import BaseService from "./BaseService"

class RecurringExpenseService extends BaseService {

    getRecurringExpenses(): Promise<RecurringExpense[]> {
        return axios.get(this.apiUrl + "/recurring-expense").then(response => {
            return response.data.map((v: Partial<RecurringExpense>) => new RecurringExpense(v))
        })
    }

    saveRecurringExpense(expense: Partial<RecurringExpense>): Promise<RecurringExpense> {
        return axios.post(this.apiUrl + "/recurring-expense/save", expense).then(response => {
            return new RecurringExpense(response.data)
        })
    }
}

export default RecurringExpenseService
