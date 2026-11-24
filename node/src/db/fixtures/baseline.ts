import type { Account } from "../../modules/accounts/entities/Account";
import type { User } from "../../modules/core/entities/User";
import type { Fixtures } from "./Fixtures";

export const BASELINE_USER_ID = 1;
export const BASELINE_ACCOUNT_ID = 1;

export interface Baseline {
    user: User;
    account: Account;
}

/**
 * Socle présent dans toute base de test : l'utilisateur de la session et un compte.
 * À appeler sur une base vide, pour que les identifiants soient ceux attendus.
 */
export async function seedBaseline(fixtures: Fixtures): Promise<Baseline> {
    const user = await fixtures.users.create({ username: "testuser", totalXp: 100 });
    const account = await fixtures.accounts.create({ id: BASELINE_ACCOUNT_ID, label: "testaccount0" });

    if (user.id !== BASELINE_USER_ID) {
        throw new Error(`Socle : utilisateur ${BASELINE_USER_ID} attendu, ${user.id} obtenu (base non vide ?)`);
    }
    return { user, account };
}
