import type { UserXpLogDto } from "@chocosous/shared";
import { UserXpLog } from "../entities/UserXpLog";
import type { User } from "../entities/User";
import { toUserDto } from "./UserMapper";

/**
 * Transforme une entité UserXpLog en DTO exposé par l'API.
 * @param log 
 * @returns 
 */
export function toUserXpLogDto(log: UserXpLog, user: User): UserXpLogDto {
    return {
        id: log.id,
        action: log.action,
        actionXp: log.actionXp,
        multiplicator: log.multiplicator,
        createdAt: log.createdAt.toISOString(),
        user: toUserDto(user),
    };
}