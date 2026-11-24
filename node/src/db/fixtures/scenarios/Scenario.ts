import type { EntityManager } from "typeorm";
import type { Fixtures } from "../Fixtures";

/**
 * Jeu de données nommé, rejouable sur une base de développement (`npm run seed -- <name>`).
 *
 * Un scénario doit pouvoir retrouver ce qu'il a créé (ex. un préfixe sur les libellés),
 * pour que `clean` le supprime sans toucher aux autres données.
 */
export interface Scenario {
    name: string;
    description: string;
    seed(fixtures: Fixtures, now: Date): Promise<void>;
    clean(manager: EntityManager): Promise<void>;
}
