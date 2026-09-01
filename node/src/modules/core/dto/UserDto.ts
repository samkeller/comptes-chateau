import type { UserDto } from "@chocosous/shared";
import { User } from "../entities/User";

/** Convertit une entité User en DTO exposé par l'API. */
export function toUserDto(user: User): UserDto {
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        totalXp: user.totalXp,
    };
}
