import type { EntityManager } from "typeorm";
import { Fixtures } from "../Fixtures";
import type { Scenario } from "./Scenario";

export interface RunScenarioOptions {
    now?: Date;
    /** Supprime les données du scénario sans les recréer. */
    cleanOnly?: boolean;
}

/** Remplace les données du scénario (nettoyage puis création), dans une seule transaction. */
export async function runScenario(manager: EntityManager, scenario: Scenario, options: RunScenarioOptions = {}): Promise<void> {
    const { now = new Date(), cleanOnly = false } = options;
    await manager.transaction(async (transaction) => {
        await scenario.clean(transaction);
        if (!cleanOnly) {
            await scenario.seed(new Fixtures(transaction), now);
        }
    });
}
