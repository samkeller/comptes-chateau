import axios from "axios";
import BaseService from "./BaseService";
import { User } from "../interfaces/User";
import type { UserDto, AvatarPayload } from "@chocosous/shared";

class UserService extends BaseService {

    me(): Promise<User> {
        return axios.get<UserDto>(this.apiUrl + "/users/me").then((r) => new User(r.data))
    }

    getAllUsers(): Promise<User[]> {
        return axios.get<UserDto[]>(this.apiUrl + "/users").then((r) => r.data.map((user) => new User(user)))
    }

    changeAvatar(avatarFileName: string): Promise<User> {
        const payload: AvatarPayload = { avatar: avatarFileName };
        return axios.post<UserDto>(this.apiUrl + "/users/avatar", payload).then((r) => new User(r.data))
    }
}

export default UserService