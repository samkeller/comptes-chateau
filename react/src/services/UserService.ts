import axios from "axios";
import BaseService from "./BaseService";
import { User } from "../interfaces/User";

class UserService extends BaseService {

    me(): Promise<User> {
        return axios.get(this.apiUrl + "/users/me").then((r) => r.data as User)
    }

    getAllUsers(): Promise<User[]> {
        return axios.get(this.apiUrl + "/users").then((r) => r.data as User[])
    }

    changeAvatar(avatarFileName: string): Promise<User> {
        return axios.post(this.apiUrl + "/users/avatar", { avatar: avatarFileName }).then((r) => r.data as User)
    }
}

export default UserService