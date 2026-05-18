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

    /**
     * Fetch account lines for a specific account with lazy loading.
     * @param accountId - The account ID
     * @param lazyState - Pagination, sorting, filtering state
     */
    getAccountLinesLazy(accountId: number, lazyState: DataTableLazyState): Promise<LazyLoadResponse> {
        const requestParams = DataTableQueryCodec.toQueryParams(lazyState).toString();

        return axios.get(`${this.apiUrl}/accounts/${accountId}/operations/lazy?${requestParams}`).then(response => {
            return {
                data: response.data.data.map((v: Partial<AccountLine>) => new AccountLine(v)),
                totalRecords: response.data.totalRecords
            };
        });
    }

    /**
     * Save (create or update) an account line for a specific account.
     * @param accountId - The account ID
     * @param accountLine - The account line data to save
     */
    saveAccountLine(accountId: number, accountLine: Partial<AccountLine>): Promise<AccountLine> {
        const { account: _account, targetAccount, ...rest } = accountLine;
        const dataToSend = {
            ...rest,
            dateOperation: rest.dateOperation ? formatApiDate(rest.dateOperation) : null,
            dateValeur: rest.dateValeur ? formatApiDate(rest.dateValeur) : null,
            targetAccount: targetAccount !== undefined
                ? (targetAccount ? { id: targetAccount.id } : null)
                : undefined,
        }

        if (rest.id) {
            return axios.put(`${this.apiUrl}/accounts/${accountId}/operations/${rest.id}`, dataToSend).then(response => {
                return new AccountLine(response.data)
            })
        }

        return axios.post(`${this.apiUrl}/accounts/${accountId}/operations`, dataToSend).then(response => {
            return new AccountLine(response.data)
        })
    }

    /**
     * Batch check operations for a specific account.
     * @param accountId - The account ID
     * @param checks - Array of checks to perform
     */
    checkBatch(accountId: number, checks: CheckBatchInput[]): Promise<number> {
        const payload = {
            checks: checks.map((check) => ({
                id: check.id,
                isChecked: check.isChecked,
                dateValeur: formatApiDate(check.dateValeur)
            }))
        };

        return axios.post(`${this.apiUrl}/accounts/${accountId}/operations/check-batch`, payload).then((response) => response.data.updatedCount);
    }

    /**
     * Get all unchecked lines for a specific account.
     * @param accountId - The account ID
     */
    getAllUncheckedLines(accountId: number): Promise<AccountLine[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/operations/unchecked`).then((response) => {
            return response.data.map((v: Partial<AccountLine>) => new AccountLine(v));
        });
    }

    /**
     * Get all account lines for a specific account (for export).
     * @param accountId - The account ID
     */
    getAllAccountLinesForExport(accountId: number): Promise<AccountLine[]> {
        return axios.get(`${this.apiUrl}/accounts/${accountId}/operations/export`).then((response) => {
            return response.data.map((value: Partial<AccountLine>) => new AccountLine(value));
        });
    }

    /**
     * Delete an account line for a specific account.
     * @param accountId 
     * @param lineId 
     * @returns 
     */
    deleteAccountingLine(accountId: number, lineId: number): Promise<void> {
        return axios.delete(`${this.apiUrl}/accounts/${accountId}/operations/${lineId}`)
    }

}

export default AccountingService