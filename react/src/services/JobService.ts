import axios from "axios";
import BaseService from "./BaseService";
import type { RunRecurringExpensesJobResponse } from "@chocosous/shared";

export default class JobService extends BaseService {
    runRecurringExpenses(): Promise<RunRecurringExpensesJobResponse> {
        return axios
            .post<RunRecurringExpensesJobResponse>(`${this.apiUrl}/jobs/run-recurring-expenses`)
            .then((r) => r.data);
    }
}
