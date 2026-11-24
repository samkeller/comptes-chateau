import type { EntityManager } from "typeorm";
import {
    AccountFactory,
    AccountLineFactory,
    AccountLineNatureFactory,
    AccountLinePosteFactory,
    BudgetItemFactory,
    RecurringExpenseFactory,
} from "./factories/accounts";
import { AccountLineRuleFactory } from "./factories/automatisations";
import { UserFactory } from "./factories/core";
import { BanquePostaleImportFactory } from "./factories/externals";
import { KanbanColumnFactory, KanbanCommentFactory, KanbanTaskFactory } from "./factories/kanban";
import { NoteFactory } from "./factories/notes";
import { StockItemFactory, StockLocationFactory, StockMovementFactory, StockUnitFactory } from "./factories/stocks";

/**
 * Point d'entrée unique pour créer des données, en test comme en développement.
 *
 *   const fx = new Fixtures(manager);
 *   const poste = await fx.postes.create({ accountId });
 *   await fx.accountLines.createMany(3, { accountId, posteId: poste.id });
 *
 * Nouvelle entité : écrire sa factory dans `factories/<module>.ts` et l'exposer ici.
 */
export class Fixtures {
    readonly users: UserFactory;
    readonly accounts: AccountFactory;
    readonly accountLines: AccountLineFactory;
    readonly postes: AccountLinePosteFactory;
    readonly natures: AccountLineNatureFactory;
    readonly budgetItems: BudgetItemFactory;
    readonly recurringExpenses: RecurringExpenseFactory;
    readonly rules: AccountLineRuleFactory;
    readonly banquePostaleImports: BanquePostaleImportFactory;
    readonly kanbanColumns: KanbanColumnFactory;
    readonly kanbanTasks: KanbanTaskFactory;
    readonly kanbanComments: KanbanCommentFactory;
    readonly notes: NoteFactory;
    readonly stockItems: StockItemFactory;
    readonly stockLocations: StockLocationFactory;
    readonly stockUnits: StockUnitFactory;
    readonly stockMovements: StockMovementFactory;

    constructor(readonly manager: EntityManager) {
        this.users = new UserFactory(manager);
        this.accounts = new AccountFactory(manager);
        this.accountLines = new AccountLineFactory(manager);
        this.postes = new AccountLinePosteFactory(manager);
        this.natures = new AccountLineNatureFactory(manager);
        this.budgetItems = new BudgetItemFactory(manager);
        this.recurringExpenses = new RecurringExpenseFactory(manager);
        this.rules = new AccountLineRuleFactory(manager);
        this.banquePostaleImports = new BanquePostaleImportFactory(manager);
        this.kanbanColumns = new KanbanColumnFactory(manager);
        this.kanbanTasks = new KanbanTaskFactory(manager);
        this.kanbanComments = new KanbanCommentFactory(manager);
        this.notes = new NoteFactory(manager);
        this.stockItems = new StockItemFactory(manager);
        this.stockLocations = new StockLocationFactory(manager);
        this.stockUnits = new StockUnitFactory(manager);
        this.stockMovements = new StockMovementFactory(manager);
    }
}
