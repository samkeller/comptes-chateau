import { describe, expect, it } from "vitest";
import { TEST_USER_ID, fixtures, testDataSource } from "../../../tests/testDbSetup";
import { Account } from "../../../modules/accounts/entities/Account";
import { JobExecutionLog } from "../../../modules/core/entities/JobExecutionLog";
import { KanbanColumn } from "../../../modules/kanban/entities/KanbanColumn";
import NotificationService from "../../../modules/notifications/services/NotificationService";
import { StockItem } from "../../../modules/stocks/entities/StockItem";
import { notificationsDemo } from "./notificationsDemo";
import { runScenario } from "./runScenario";

const NOW = new Date(2026, 10, 24, 12);

async function homeNotificationTypes(): Promise<string[]> {
    const notifications = await new NotificationService(testDataSource.manager).getForUser(TEST_USER_ID, NOW);
    return notifications.map((notification) => notification.type).sort();
}

describe("notificationsDemo scenario", () => {
    it("makes every home notification appear", async () => {
        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW });

        expect(await homeNotificationTypes()).toEqual([
            "ACCOUNT_BUDGET_EXCEEDED",
            "ACCOUNT_GOING_NEGATIVE",
            "ACCOUNT_NEGATIVE",
            "BACKUP_SUCCEEDED",
            "JOB_FAILED",
            "KANBAN_TASK_ASSIGNED",
            "KANBAN_TASK_COMMENTED",
            "OPERATIONS_TO_CHECK",
            "STOCK_EXPIRED",
            "STOCK_EXPIRING_SOON",
        ]);
    });

    it("can be replayed without duplicating its data", async () => {
        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW });
        const onceTypes = await homeNotificationTypes();
        const onceAccounts = await testDataSource.getRepository(Account).count();

        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW });

        expect(await homeNotificationTypes()).toEqual(onceTypes);
        await expect(testDataSource.getRepository(Account).count()).resolves.toBe(onceAccounts);
    });

    it("removes everything it created when cleaning", async () => {
        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW });

        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW, cleanOnly: true });

        expect(await homeNotificationTypes()).toEqual([]);
        await expect(testDataSource.getRepository(Account).count()).resolves.toBe(1);
        await expect(testDataSource.getRepository(StockItem).count()).resolves.toBe(0);
        await expect(testDataSource.getRepository(KanbanColumn).count()).resolves.toBe(0);
        await expect(testDataSource.getRepository(JobExecutionLog).count()).resolves.toBe(0);
    });

    it("leaves data it did not create untouched", async () => {
        const column = await fixtures.kanbanColumns.create({ label: "À faire" });

        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW });
        await runScenario(testDataSource.manager, notificationsDemo, { now: NOW, cleanOnly: true });

        await expect(testDataSource.getRepository(KanbanColumn).find()).resolves.toEqual([expect.objectContaining({ id: column.id })]);
    });
});
