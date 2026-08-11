import axios from "axios";
import BaseService from "./BaseService";
import { User } from "../interfaces/User";

class AuthService extends BaseService {

    login(username: string, password: string): Promise<User> {
        return axios.post(this.apiUrl + "/auth/login", { username, password }).then((r) => r.data as User)
    }

    logout(): Promise<void> {
        return axios.post(this.apiUrl + "/auth/logout")
    }

}

export default AuthService