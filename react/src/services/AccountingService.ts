import axios from "axios"
import AccountLine from "../interfaces/AccountLine"
import { AccountLineNature } from "../interfaces/AccountLineNature"
import { AccountLinePoste } from "../interfaces/AccountLinePoste"
import { toLocaleIsoString } from "../Utils/DatesUtils"
import { LazyTableState } from "../pages/accountBook/AccountBook"
import BaseService from "./BaseService"
import LazyParser from "./LazyParser"

export interface LazyLoadResponse {
    data: AccountLine[];
    totalRecords: number;
}

class AccountingService extends BaseService {

    getAccountingLinesLazy(lazyState: LazyTableState): Promise<LazyLoadResponse> {
        const params = new URLSearchParams();
        // default pagination (virtual scroller currently doesn't provide skip/take)
        params.append('skip', '0');
        params.append('take', '100');

        // Sorts
        if (lazyState.sortField) {
            const sortOrder = lazyState.sortOrder === -1 ? 'DESC' : 'ASC';
            params.append('sortField', lazyState.sortField);
            params.append('sortOrder', sortOrder);
        }

        // Filters
        if (lazyState.filters) {
            Object.keys(lazyState.filters).forEach(key => {
                const meta = lazyState.filters[key];
                if (!meta) return;

                const value = meta.value;

                if (value === null || value === undefined || value === '') return;

                switch (key) {
                    case 'dateOperation': {
                        const { from, to } = LazyParser.parseDateFilter(value, meta.matchMode);
                        params.append('dateOperationFrom', toLocaleIsoString(from));
                        params.append('dateOperationTo', toLocaleIsoString(to));
                        break;
                    }
                    case 'dateValeur': {
                        const { from, to } = LazyParser.parseDateFilter(value, meta.matchMode);
                        params.append('dateValeurFrom', toLocaleIsoString(from));
                        params.append('dateValeurTo', toLocaleIsoString(to));
                        break;
                    }
                    case 'operation':
                        params.append('operation', String(value));
                        break;
                    case 'nature.label':
                        params.append('nature', String(value));
                        break;
                    case 'poste.label':
                        params.append('poste', String(value));
                        break;
                    default:
                        throw new Error(`Unknown filter key: ${key}`);
                }
            });
        }

        const requestParams = params.toString();

        return axios.get(`${this.apiUrl}/operation/lazy?${requestParams}`).then(response => {
            return {
                data: response.data.data.map((v: Partial<AccountLine>) => new AccountLine(v)),
                totalRecords: response.data.totalRecords
            };
        });
    }

    saveAccountingLine(accountLine: Partial<AccountLine>): Promise<AccountLine> {
        const dataToSend = {
            ...accountLine,
            dateOperation: accountLine.dateOperation ? toLocaleIsoString(accountLine.dateOperation) : null,
            ...(accountLine.dateValeur && { dateValeur: toLocaleIsoString(accountLine.dateValeur) })
        }

        return axios.post(this.apiUrl + "/operation", dataToSend).then(response => {
            return new AccountLine(response.data)
        })
    }

    getAllNatures(): Promise<AccountLineNature[]> {
        return axios.get(this.apiUrl + "/nature").then(response => {
            return response.data
        })
    }

    getAllPostes(): Promise<AccountLinePoste[]> {
        return axios.get(this.apiUrl + "/poste").then(response => {
            return response.data
        })
    }
}

export default AccountingService