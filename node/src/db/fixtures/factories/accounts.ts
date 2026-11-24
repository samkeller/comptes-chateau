import type { DeepPartial, EntityManager } from "typeorm";
import { Account } from "../../../modules/accounts/entities/Account";
import { AccountLine, AccountLineSource } from "../../../modules/accounts/entities/AccountLine";
import { AccountLineNature } from "../../../modules/accounts/entities/AccountLineNature";
import { AccountLinePoste } from "../../../modules/accounts/entities/AccountLinePoste";
import { BudgetItem } from "../../../modules/accounts/entities/BudgetItem";
import { RecurringExpense, RecurringExpenseFrequency } from "../../../modules/accounts/entities/RecurringExpense";
import { EntityFactory } from "../EntityFactory";

export class AccountFactory extends EntityFactory<Account> {
    constructor(manager: EntityManager) {
        super(manager, Account);
    }

    /**
     * L'id d'un compte n'est pas généré par la base : on prend le suivant.
     * Date de référence fixe et ancienne : toute opération datée compte dans le solde, et le résultat ne dépend pas du jour.
     */
    protected async defaults(sequence: number): Promise<DeepPartial<Account>> {
        return {
            id: (await this.maxOf("id")) + 1,
            label: `Compte ${sequence}`,
            baseLineAmount: 0,
            baseLineEffectiveDate: new Date("2000-01-01"),
        };
    }
}

export class AccountLineFactory extends EntityFactory<AccountLine, "accountId"> {
    constructor(manager: EntityManager) {
        super(manager, AccountLine);
    }

    protected defaults(sequence: number): DeepPartial<AccountLine> {
        return {
            label: `Opération ${sequence}`,
            debit: 0,
            credit: 0,
            isChecked: false,
            dateOperation: new Date(),
            dateValeur: null,
            source: AccountLineSource.MANUAL,
        };
    }
}

export class AccountLinePosteFactory extends EntityFactory<AccountLinePoste, "accountId"> {
    constructor(manager: EntityManager) {
        super(manager, AccountLinePoste);
    }

    protected defaults(sequence: number): DeepPartial<AccountLinePoste> {
        return { label: `Poste ${sequence}`, color: "#123456" };
    }
}

export class AccountLineNatureFactory extends EntityFactory<AccountLineNature> {
    constructor(manager: EntityManager) {
        super(manager, AccountLineNature);
    }

    protected defaults(sequence: number): DeepPartial<AccountLineNature> {
        return { label: `Nature ${sequence}`, color: "#654321", isHorsCompte: false };
    }
}

export type BudgetItemInput = Omit<DeepPartial<BudgetItem>, "account" | "poste"> & {
    accountId: number;
    posteId?: number | null;
};

/**
 * `BudgetItem` n'expose que ses relations (pas de colonnes `accountId` / `posteId`, volontairement :
 * `BudgetService.update` sauvegarde `{ ...existing, poste }`, une colonne en double y réécrirait l'ancien poste).
 * La factory accepte donc des ids, comme les autres, et les traduit en relations.
 */
export class BudgetItemFactory extends EntityFactory<BudgetItem, never, BudgetItemInput> {
    constructor(manager: EntityManager) {
        super(manager, BudgetItem);
    }

    protected defaults(sequence: number): DeepPartial<BudgetItem> {
        return { label: `Budget ${sequence}`, amount: 100, isActive: true, sortOrder: 0, poste: null };
    }

    protected toAttributes({ accountId, posteId, ...attributes }: BudgetItemInput): DeepPartial<BudgetItem> {
        return {
            ...attributes,
            account: { id: accountId },
            ...(posteId !== undefined && { poste: posteId === null ? null : { id: posteId } }),
        };
    }
}

export class RecurringExpenseFactory extends EntityFactory<RecurringExpense, "accountId"> {
    constructor(manager: EntityManager) {
        super(manager, RecurringExpense);
    }

    protected defaults(sequence: number): DeepPartial<RecurringExpense> {
        return {
            label: `Dépense récurrente ${sequence}`,
            solde: 10,
            isActive: true,
            nextOccurrence: new Date(),
            frequency: RecurringExpenseFrequency.MONTHLY,
            natureId: null,
            posteId: null,
        };
    }
}
