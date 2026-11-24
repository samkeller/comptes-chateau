import type { DeepPartial, EntityManager } from "typeorm";
import { User } from "../../../modules/core/entities/User";
import { EntityFactory } from "../EntityFactory";

export class UserFactory extends EntityFactory<User> {
    constructor(manager: EntityManager) {
        super(manager, User);
    }

    /** Le hash n'est pas un vrai hash bcrypt : un utilisateur de fixture ne peut pas se connecter. */
    protected defaults(sequence: number): DeepPartial<User> {
        return {
            username: `user${sequence}`,
            avatar: "default-avatar.png",
            passwordHash: "fixture-password-hash",
            totalXp: 0,
        };
    }
}
