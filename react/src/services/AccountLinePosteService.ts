import axios from "axios";
import { AccountLinePoste } from "../interfaces/AccountLinePoste";
import BaseService from "./BaseService";

export interface SavePostePayload {
    label: string;
    color: string;
}

class AccountLinePosteService extends BaseService {

    private posteEndpoint = this.apiUrl + "/poste";
    getAllPostes(): Promise<AccountLinePoste[]> {
        return axios.get(this.posteEndpoint).then(response => {
            return (response.data as Partial<AccountLinePoste>[]).map((value) => new AccountLinePoste(value));
        });
    }

    createPoste(payload: SavePostePayload): Promise<AccountLinePoste> {
        return axios.post(this.posteEndpoint, payload).then(response => new AccountLinePoste(response.data));
    }

    updatePoste(id: number, payload: SavePostePayload): Promise<AccountLinePoste> {
        return axios.put(this.posteEndpoint + `/${id}`, payload).then(response => new AccountLinePoste(response.data));
    }

    deletePoste(id: number): Promise<void> {
        return axios.delete(this.posteEndpoint + `/${id}`).then(() => undefined);
    }
}

export default AccountLinePosteService;
