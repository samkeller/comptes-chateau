import axios from "axios";
import BaseService from "./BaseService";
import { User } from "../interfaces/User";
import type { LoginRequest, LoginResponse } from "@chocosous/shared";

class AuthService extends BaseService {

    login(username: string, password: string): Promise<User> {
        const payload: LoginRequest = { username, password };
        return axios.post<LoginResponse>(this.apiUrl + "/auth/login", payload).then((r) => new User(r.data))
    }

    logout(): Promise<void> {
        return axios.post(this.apiUrl + "/auth/logout")
    }

}

export default AuthService