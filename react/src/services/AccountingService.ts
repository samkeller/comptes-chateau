import axios from "axios"
import AccountLine from "../interfaces/AccountLine"
import { formatApiDate } from "./ApiDateCodec"
import BaseService from "./BaseService"
import DataTableQueryCodec, { DataTableLazyState } from "./tableQuery/DataTableQueryCodec"

export interface LazyLoadResponse {
    data: AccountLine[];
    totalRecords: number;
}

export interface CheckBatchInput {
    id: number;
    isChecked: boolean;
    dateValeur: Date;
}

class AccountingService extends BaseService {

    getAccountLinesLazy(lazyState: DataTableLazyState): Promise<LazyLoadResponse> {
        const requestParams = DataTableQueryCodec.toQueryParams(lazyState).toString();

        return axios.get(`${this.apiUrl}/operation/lazy?${requestParams}`).then(response => {
            return {
                data: response.data.data.map((v: Partial<AccountLine>) => new AccountLine(v)),
                totalRecords: response.data.totalRecords
            };
        });
    }

    saveAccountLine(accountLine: Partial<AccountLine>): Promise<AccountLine> {
        const dataToSend = {
            ...accountLine,
            dateOperation: accountLine.dateOperation ? formatApiDate(accountLine.dateOperation) : null,
            dateValeur: accountLine.dateValeur ? formatApiDate(accountLine.dateValeur) : null,
        }

        return axios.post(this.apiUrl + "/operation", dataToSend).then(response => {
            return new AccountLine(response.data)
        })
    }

    checkBatch(checks: CheckBatchInput[]): Promise<number> {
        const payload = {
            checks: checks.map((check) => ({
                id: check.id,
                isChecked: check.isChecked,
                dateValeur: formatApiDate(check.dateValeur)
            }))
        };

        return axios.post(this.apiUrl + "/operation/check-batch", payload).then((response) => response.data.updatedCount);
    }

    getAllUncheckedLines(): Promise<AccountLine[]> {
        return axios.get(`${this.apiUrl}/operation/unchecked`).then((response) => {
            return response.data.map((v: Partial<AccountLine>) => new AccountLine(v));
        });
    }

    getAllAccountLinesForExport(): Promise<AccountLine[]> {
        return axios.get(`${this.apiUrl}/operation/export`).then((response) => {
            return response.data.map((value: Partial<AccountLine>) => new AccountLine(value));
        });
    }

}

export default AccountingService