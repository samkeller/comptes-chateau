import axios from "axios";
import { AccountLinePoste } from "../interfaces/AccountLinePoste";
import BaseService from "./BaseService";

export interface SavePostePayload {
    label: string;
    color: string;
}

class AccountLinePosteService extends BaseService {

    /**
     * Get all postes for a specific account.
     * @param accountId - The account ID
     */
    getAllAccountPostes(accountId: number): Promise<AccountLinePoste[]> {
        const posteEndpoint = `${this.apiUrl}/accounts/${accountId}/postes`;
        return axios.get(posteEndpoint).then(response => {
            return (response.data as Partial<AccountLinePoste>[]).map((value) => new AccountLinePoste(value));
        });
    }

    /**
     * Create a poste for a specific account.
     * @param accountId - The account ID
     * @param payload - The poste data
     */
    createAccountPoste(accountId: number, payload: SavePostePayload): Promise<AccountLinePoste> {
        const posteEndpoint = `${this.apiUrl}/accounts/${accountId}/postes`;
        return axios.post(posteEndpoint, payload).then(response => new AccountLinePoste(response.data));
    }

    /**
     * Update a poste for a specific account.
     * @param accountId - The account ID
     * @param id - The poste ID
     * @param payload - The updated poste data
     */
    updatAccountePoste(accountId: number, id: number, payload: SavePostePayload): Promise<AccountLinePoste> {
        const posteEndpoint = `${this.apiUrl}/accounts/${accountId}/postes/${id}`;
        return axios.put(posteEndpoint, payload).then(response => new AccountLinePoste(response.data));
    }

    /**
     * Delete a poste for a specific account.
     * @param accountId - The account ID
     * @param id - The poste ID
     */
    deleteAccountPoste(accountId: number, id: number): Promise<void> {
        const posteEndpoint = `${this.apiUrl}/accounts/${accountId}/postes/${id}`;
        return axios.delete(posteEndpoint).then(() => undefined);
    }
}

export default AccountLinePosteService;
