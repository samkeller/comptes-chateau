import type { DeepPartial, EntityManager } from "typeorm";
import { AccountLineRule } from "../../../modules/automatisations/entities/AccountLineRule";
import { EntityFactory } from "../EntityFactory";

export class AccountLineRuleFactory extends EntityFactory<AccountLineRule, "accountId"> {
    constructor(manager: EntityManager) {
        super(manager, AccountLineRule);
    }

    protected defaults(sequence: number): DeepPartial<AccountLineRule> {
        return {
            label: `Règle ${sequence}`,
            pattern: `regle ${sequence}`,
            occurrencesCount: 0,
            posteId: null,
            natureId: null,
        };
    }
}
