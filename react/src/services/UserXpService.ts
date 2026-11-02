import axios from "axios";
import BaseService from "./BaseService";
import { UserXpLogDto, UserXpActionDto } from "@chocosous/shared";

class UserXpService extends BaseService {

    private baseUrl = this.apiUrl + "/users/xp";

    getAllLogs(): Promise<UserXpLogDto[]> {
        return axios.get(this.baseUrl).then((r) => r.data)
    }

    getActions(): Promise<UserXpActionDto[]> {
        return axios.get(this.baseUrl + "/actions").then((r) => r.data)
    }
}

export default UserXpService