import axios from "axios";
import BaseService from "./BaseService";

class AuthService extends BaseService {

    login(password: string): Promise<void> {
        return axios.post(this.baseUrl + "/auth/login", { password })
    }

    logout(): Promise<void> {
        return axios.post(this.baseUrl + "/auth/logout")
    }
}

export default AuthService