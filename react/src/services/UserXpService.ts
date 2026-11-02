import axios from "axios";
import BaseService from "./BaseService";
import { UserXpActionDto, UserXpLogDto } from "@chocosous/shared";
import { UserXpLog } from "../interfaces/core/UserXpLog";
import { UserXpAction } from "@/interfaces/core/UserXpAction";

class UserXpService extends BaseService {

    private baseUrl = this.apiUrl + "/users/xp";

    getAllLogs(): Promise<UserXpLog[]> {
        return axios.get(this.baseUrl).then((r) => r.data.map((log: UserXpLogDto) => new UserXpLog(log)));
    }

    getActions(): Promise<UserXpAction[]> {
        return axios.get(this.baseUrl + "/actions").then((r) => r.data.map((action: UserXpActionDto) => new UserXpAction(action)))
    }
}

export default UserXpService