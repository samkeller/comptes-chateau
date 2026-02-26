import axios from "axios"
import RecurringExpense from "../interfaces/RecurringExpense"
import BaseService from "./BaseService"
import { toLocaleIsoString } from "../utils/DatesUtils"

class RecurringExpenseService extends BaseService {

    getRecurringExpenses(): Promise<RecurringExpense[]> {
        return axios.get(this.apiUrl + "/recurring-expense").then(response => {
            return response.data.map((v: Partial<RecurringExpense>) => new RecurringExpense(v))
        })
    }

    saveRecurringExpense(expense: Partial<RecurringExpense>): Promise<RecurringExpense> {
         const dataToSend = {
            ...expense,
            ...(expense.nextOccurrence && { nextOccurrence: toLocaleIsoString(expense.nextOccurrence) })
        }
        
        return axios.post(this.apiUrl + "/recurring-expense/save", dataToSend).then(response => {
            return new RecurringExpense(response.data)
        })
    }
}

export default RecurringExpenseService
