import { User } from "../entities/User";

export interface UserDto {
    id: number;
    username: string;
    avatar: string;
    totalXp: number;
}

export function toUserDto(user: User): UserDto {
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        totalXp: user.totalXp,
    };
}
