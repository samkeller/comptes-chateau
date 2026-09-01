import axios from "axios";
import { AccountLineNature } from "../interfaces/AccountLineNature";
import BaseService from "./BaseService";
import type { SaveNaturePayload } from "@chocosous/shared";

class AccountLineNatureService extends BaseService {

    private natureEndpoint = this.apiUrl + "/nature";

    getAllNatures(): Promise<AccountLineNature[]> {
        return axios.get(this.natureEndpoint).then(response => {
            return (response.data as Partial<AccountLineNature>[]).map((value) => new AccountLineNature(value));
        });
    }

    createNature(payload: SaveNaturePayload): Promise<AccountLineNature> {
        return axios.post(this.natureEndpoint, payload).then(response => new AccountLineNature(response.data));
    }

    updateNature(id: number, payload: SaveNaturePayload): Promise<AccountLineNature> {
        return axios.put(this.natureEndpoint + `/${id}`, payload).then(response => new AccountLineNature(response.data));
    }

    deleteNature(id: number): Promise<void> {
        return axios.delete(this.natureEndpoint + `/${id}`).then(() => undefined);
    }
}

export default AccountLineNatureService;
