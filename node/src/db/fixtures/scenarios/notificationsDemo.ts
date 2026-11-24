import { addDays, subDays, subMonths } from "date-fns";
import { In, Like, type EntityManager } from "typeorm";
import { BACKUP_DB_JOB_NAME } from "../../../jobs/backupDb";
import { OPEN_FOOD_FACTS_SYNC_JOB_NAME } from "../../../jobs/syncOpenFoodFacts";
import { Account } from "../../../modules/accounts/entities/Account";
import { AccountLine } from "../../../modules/accounts/entities/AccountLine";
import { AccountLinePoste } from "../../../modules/accounts/entities/AccountLinePoste";
import { BudgetItem } from "../../../modules/accounts/entities/BudgetItem";
import { JobExecutionLog } from "../../../modules/core/entities/JobExecutionLog";
import { User } from "../../../modules/core/entities/User";
import JobExecutionLogService from "../../../modules/core/services/JobExecutionLogService";
import { KanbanColumn } from "../../../modules/kanban/entities/KanbanColumn";
import { KanbanTask } from "../../../modules/kanban/entities/KanbanTask";
import { Notification } from "../../../modules/notifications/entities/Notification";
import NotificationService from "../../../modules/notifications/services/NotificationService";
import { StockItem } from "../../../modules/stocks/entities/StockItem";
import { StockLocation } from "../../../modules/stocks/entities/StockLocation";
import { StockUnit } from "../../../modules/stocks/entities/StockUnit";
import { formatApiDate } from "../../../utils/DateUtils";
import type { Fixtures } from "../Fixtures";
import type { Scenario } from "./Scenario";

/** Préfixe de tout ce que crée le scénario : c'est ainsi que `clean` le retrouve. */
const DEMO = "[Démo]";
const isDemo = Like(`${DEMO}%`);

/** Compte à découvert, budget dépassé et 7 opérations à valider. */
async function seedOverdrawnAccount(fixtures: Fixtures, now: Date): Promise<void> {
    const account = await fixtures.accounts.create({
        label: `${DEMO} Compte à découvert`,
        baseLineAmount: 100,
        baseLineEffectiveDate: subMonths(now, 2),
    });
    const poste = await fixtures.postes.create({ accountId: account.id, label: `${DEMO} Courses`, color: "#e11d48" });
    await fixtures.budgetItems.create({ accountId: account.id, posteId: poste.id, label: `${DEMO} Courses`, amount: 200 });

    // Opérations datées d'aujourd'hui : elles comptent dans le mois courant quel que soit le jour du lancement.
    // Pointée : le solde actuel passe à -250 €.
    await fixtures.accountLines.create({
        accountId: account.id,
        label: `${DEMO} Gros achat pointé`,
        debit: 350,
        isChecked: true,
        dateOperation: now,
        dateValeur: now,
    });
    // 7 opérations à valider (> 5), 245 € de courses pour 200 € de budget.
    await fixtures.accountLines.createMany(7, (index) => ({
        accountId: account.id,
        posteId: poste.id,
        label: `${DEMO} Courses n°${index + 1}`,
        debit: 35,
        dateOperation: now,
    }));
}

/** Compte encore positif, mais dont le prévisionnel de fin de mois est négatif. */
async function seedGoingNegativeAccount(fixtures: Fixtures, now: Date): Promise<void> {
    const account = await fixtures.accounts.create({
        label: `${DEMO} Compte bientôt à découvert`,
        baseLineAmount: 300,
        baseLineEffectiveDate: subMonths(now, 2),
    });
    // Non pointée : le solde reste à 300 €, le prévisionnel de fin de mois tombe à -200 €.
    await fixtures.accountLines.create({
        accountId: account.id,
        label: `${DEMO} Prélèvement non pointé`,
        debit: 500,
        dateOperation: now,
    });
}

/** Un produit périmé, un qui périme dans 5 jours. */
async function seedStock(fixtures: Fixtures, now: Date): Promise<void> {
    const location = await fixtures.stockLocations.create({ label: `${DEMO} Frigo` });
    const yogurt = await fixtures.stockItems.create({ label: `${DEMO} Yaourt`, defaultUnit: "u" });
    const milk = await fixtures.stockItems.create({ label: `${DEMO} Lait`, defaultUnit: "L" });
    await fixtures.stockUnits.create({ itemId: yogurt.id, locationId: location.id, unit: "u", expirationDate: formatApiDate(subDays(now, 2)) });
    await fixtures.stockUnits.create({ itemId: milk.id, locationId: location.id, unit: "L", expirationDate: formatApiDate(addDays(now, 5)) });
}

/** Un backup réussi et une synchronisation OpenFoodFacts en échec. */
async function seedJobLogs(fixtures: Fixtures): Promise<void> {
    const logService = new JobExecutionLogService(fixtures.manager);
    await logService.logSuccess(BACKUP_DB_JOB_NAME, `${DEMO} Sauvegarde de démonstration`);
    await logService.logError(OPEN_FOOD_FACTS_SYNC_JOB_NAME, `${DEMO} Échec de démonstration`);
}

/** Une tâche assignée et commentée, notifiée à tous les utilisateurs. */
async function seedKanban(fixtures: Fixtures): Promise<void> {
    const column = await fixtures.manager.findOne(KanbanColumn, { where: {}, order: { order: "ASC" } })
        ?? await fixtures.kanbanColumns.create({ label: `${DEMO} À faire` });
    const users = await fixtures.manager.find(User);
    const task = await fixtures.kanbanTasks.create({ columnId: column.id, title: `${DEMO} Vider le frigo`, assignees: users });

    const notificationService = new NotificationService(fixtures.manager);
    await notificationService.publish({
        type: "KANBAN_TASK_ASSIGNED",
        severity: "info",
        title: `${DEMO} Tâche assignée`,
        message: `On vous a assigné « ${task.title} ».`,
        target: { kind: "kanban", taskId: task.id },
        recipientUserIds: users.map((user) => user.id),
    });
    await notificationService.publish({
        type: "KANBAN_TASK_COMMENTED",
        severity: "info",
        title: `${DEMO} Nouveau commentaire`,
        message: `Sur « ${task.title} » : pense à jeter le yaourt.`,
        target: { kind: "kanban", taskId: task.id, tab: "comments" },
    });
}

async function clean(manager: EntityManager): Promise<void> {
    const accountIds = (await manager.findBy(Account, { label: isDemo })).map((account) => account.id);
    if (accountIds.length > 0) {
        await manager.delete(BudgetItem, { account: { id: In(accountIds) } });
        await manager.delete(AccountLine, { accountId: In(accountIds) });
        await manager.delete(AccountLinePoste, { accountId: In(accountIds) });
        await manager.delete(Account, { id: In(accountIds) });
    }

    const itemIds = (await manager.findBy(StockItem, { label: isDemo })).map((item) => item.id);
    if (itemIds.length > 0) {
        await manager.delete(StockUnit, { itemId: In(itemIds) });
        await manager.delete(StockItem, { id: In(itemIds) });
    }
    await manager.delete(StockLocation, { label: isDemo });

    await manager.delete(JobExecutionLog, { message: isDemo });
    await manager.delete(KanbanTask, { title: isDemo });
    await manager.delete(KanbanColumn, { label: isDemo });
    await manager.delete(Notification, { title: isDemo });
}

/** Déclenche chaque notification de l'accueil. Tout ce qui est créé est préfixé « [Démo] ». */
export const notificationsDemo: Scenario = {
    name: "notifications-demo",
    description: "Données qui déclenchent chaque notification de l'accueil (préfixe « [Démo] »).",
    async seed(fixtures, now) {
        await seedOverdrawnAccount(fixtures, now);
        await seedGoingNegativeAccount(fixtures, now);
        await seedStock(fixtures, now);
        await seedJobLogs(fixtures);
        await seedKanban(fixtures);
    },
    clean,
};
