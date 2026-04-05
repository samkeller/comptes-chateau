import axios from "axios";
import BaseService from "./BaseService";

export interface ManualJobRunResponse {
    triggeredAt: string;
    processedCount: number;
}

export default class JobService extends BaseService {
    runRecurringExpenses(): Promise<ManualJobRunResponse> {
        return axios
            .post<ManualJobRunResponse>(`${this.apiUrl}/jobs/run-recurring-expenses`)
            .then((r) => r.data);
    }
}
