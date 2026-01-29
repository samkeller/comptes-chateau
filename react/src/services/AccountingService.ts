import axios from "axios"
import AccountLine from "../interfaces/AccountLine"
import { AccountLineNature } from "../interfaces/AccountLineNature"
import { AccountLinePoste } from "../interfaces/AccountLinePoste"
import { toLocaleIsoString } from "../Utils/DatesUtils"
import { LazyTableState } from "../pages/accountBook/AccountBook"

class BaseService {
    protected apiUrl = import.meta.env.VITE_API_URL
}

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
                        const d = value instanceof Date ? value : new Date(value);
                        const from = new Date(d);
                        from.setHours(0, 0, 0, 0);
                        const to = new Date(d);
                        to.setHours(23, 59, 59, 999);
                        params.append('dateOperationFrom', from.toISOString());
                        params.append('dateOperationTo', to.toISOString());
                        break;
                    }
                    case 'dateValeur': {
                        const d = value instanceof Date ? value : new Date(value);
                        const from = new Date(d);
                        from.setHours(0, 0, 0, 0);
                        const to = new Date(d);
                        to.setHours(23, 59, 59, 999);
                        params.append('dateValeurFrom', from.toISOString());
                        params.append('dateValeurTo', to.toISOString());
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

        return axios.get(`${this.apiUrl}operation/lazy?${requestParams}`).then(response => {
            return {
                data: response.data.data.map((v: Partial<AccountLine>) => new AccountLine(v)),
                totalRecords: response.data.totalRecords
            };
        });
    }

    createAccountingLine(accountLine: Partial<AccountLine>): Promise<AccountLine> {
        const dataToSend = {
            ...accountLine,
            dateOperation: accountLine.dateOperation ? toLocaleIsoString(accountLine.dateOperation) : null,
            ...(accountLine.dateValeur && { dateValeur: toLocaleIsoString(accountLine.dateValeur) })
        }

        return axios.post(this.apiUrl + "operation/", dataToSend).then(response => {
            return new AccountLine(response.data)
        })
    }

    getAllNatures(): Promise<AccountLineNature[]> {
        return axios.get(this.apiUrl + "nature/").then(response => {
            return response.data
        })
    }

    getAllPostes(): Promise<AccountLinePoste[]> {
        return axios.get(this.apiUrl + "poste/").then(response => {
            return response.data
        })
    }
}

export default AccountingService