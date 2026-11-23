import { describe, expect, it } from "vitest";
import type { NotificationDto } from "@chocosous/shared";
import { User } from "../../core/entities/User";
import { addDays, subDays } from "date-fns";
import { TEST_ACCOUNT_ID, TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { formatApiDate } from "../../../utils/DateUtils";
import AccountLineService from "../../accounts/services/AccountLineService";
import JobExecutionLogService from "../../core/services/JobExecutionLogService";
import { BACKUP_DB_JOB_NAME } from "../../../jobs/backupDb";
import { StockItem } from "../../stocks/entities/StockItem";
import { StockLocation } from "../../stocks/entities/StockLocation";
import { StockUnit } from "../../stocks/entities/StockUnit";
import type { NotificationProvider } from "../NotificationProvider";
import NotificationService from "./NotificationService";

const NOW = new Date();

async function createOtherUser(): Promise<number> {
    const user = await testDataSource.getRepository(User).save({
        username: "gaelle",
        avatar: "default-avatar.png",
        passwordHash: "hash",
        totalXp: 0,
    });
    return user.id;
}

function staticProvider(notifications: NotificationDto[]): NotificationProvider {
    return { name: "static", collect: async () => notifications };
}

const event = {
    type: "KANBAN_TASK_COMMENTED",
    severity: "info" as const,
    title: "Nouveau commentaire",
    message: "Sur « Courses »",
    target: { kind: "kanban" as const, taskId: 4 },
};

describe("NotificationService", () => {
    it("shows a broadcast event to every user except its author", async () => {
        const otherUserId = await createOtherUser();
        const service = new NotificationService(testDataSource.manager, []);

        await service.publish({ ...event, actorUserId: otherUserId });

        expect(await service.getForUser(TEST_USER_ID, NOW)).toEqual([
            expect.objectContaining({ type: "KANBAN_TASK_COMMENTED", title: "Nouveau commentaire", target: { kind: "kanban", taskId: 4 } }),
        ]);
        expect(await service.getForUser(otherUserId, NOW)).toEqual([]);
    });

    it("shows a targeted event only to its recipients", async () => {
        const otherUserId = await createOtherUser();
        const service = new NotificationService(testDataSource.manager, []);

        await service.publish({ ...event, type: "KANBAN_TASK_ASSIGNED", recipientUserIds: [otherUserId] });

        expect(await service.getForUser(TEST_USER_ID, NOW)).toEqual([]);
        expect(await service.getForUser(otherUserId, NOW)).toEqual([expect.objectContaining({ type: "KANBAN_TASK_ASSIGNED" })]);
    });

    it("merges events with provider notifications, most severe first then most recent", async () => {
        const service = new NotificationService(testDataSource.manager, [
            staticProvider([
                { key: "B", type: "B", severity: "medium", title: "B", message: "", occurredAt: "2026-01-01T00:00:00.000Z", target: null },
                { key: "A", type: "A", severity: "high", title: "A", message: "", occurredAt: "2026-01-01T00:00:00.000Z", target: null },
                { key: "C", type: "C", severity: "medium", title: "C", message: "", occurredAt: "2026-02-01T00:00:00.000Z", target: null },
            ]),
        ]);
        await service.publish(event);

        const titles = (await service.getForUser(TEST_USER_ID, NOW)).map((notification) => notification.title);

        expect(titles).toEqual(["A", "C", "B", "Nouveau commentaire"]);
    });

    it("hides a dismissed notification for that user only, and tolerates dismissing twice", async () => {
        const otherUserId = await createOtherUser();
        const service = new NotificationService(testDataSource.manager, [
            staticProvider([{ key: "STATE:1", type: "STATE", severity: "high", title: "État", message: "", occurredAt: NOW.toISOString(), target: null }]),
        ]);
        await service.publish(event);
        const eventKey = (await service.getForUser(TEST_USER_ID, NOW)).find((notification) => notification.type === event.type)!.key;

        await service.dismiss(TEST_USER_ID, eventKey);
        await service.dismiss(TEST_USER_ID, "STATE:1");
        await service.dismiss(TEST_USER_ID, "STATE:1");

        expect(await service.getForUser(TEST_USER_ID, NOW)).toEqual([]);
        expect(await service.getForUser(otherUserId, NOW)).toHaveLength(2);
    });

    it("still returns the other notifications when a provider fails", async () => {
        const failingProvider: NotificationProvider = { name: "broken", collect: async () => { throw new Error("boom"); } };
        const service = new NotificationService(testDataSource.manager, [
            failingProvider,
            staticProvider([{ key: "OK", type: "OK", severity: "info", title: "OK", message: "", occurredAt: NOW.toISOString(), target: null }]),
        ]);

        expect(await service.getForUser(TEST_USER_ID, NOW)).toEqual([expect.objectContaining({ key: "OK" })]);
    });

    describe("with the registered providers", () => {
        it("reports expired and soon-to-expire stock, a failed job and an overdrawn account", async () => {
            const location = await testDataSource.getRepository(StockLocation).save({ label: "Cuisine" });
            const [milk, butter, rice] = await testDataSource.getRepository(StockItem).save([
                { label: "Lait", defaultUnit: "L" },
                { label: "Beurre", defaultUnit: "g" },
                { label: "Riz", defaultUnit: "g" },
            ]);
            const unit = { locationId: location.id, quantity: 1, unit: "u" };
            await testDataSource.getRepository(StockUnit).save([
                { ...unit, itemId: milk.id, expirationDate: formatApiDate(subDays(NOW, 1)) },
                { ...unit, itemId: milk.id, expirationDate: formatApiDate(addDays(NOW, 3)) },
                { ...unit, itemId: butter.id, expirationDate: formatApiDate(NOW) },
                { ...unit, itemId: rice.id, expirationDate: formatApiDate(addDays(NOW, 90)) },
            ]);
            await new JobExecutionLogService(testDataSource.manager).logError("nightly-cron", "boom");
            await new AccountLineService(testDataSource.manager).saveAll([{
                label: "Gros achat",
                debit: 500,
                credit: 0,
                dateOperation: subDays(NOW, 1),
                isChecked: true,
                dateValeur: subDays(NOW, 1),
                accountId: TEST_ACCOUNT_ID,
            }]);

            const notifications = await new NotificationService().getForUser(TEST_USER_ID, NOW);

            expect(notifications).toEqual(expect.arrayContaining([
                expect.objectContaining({ type: "STOCK_EXPIRED", message: "Lait" }),
                expect.objectContaining({ type: "STOCK_EXPIRING_SOON", message: "Beurre" }),
                expect.objectContaining({ type: "JOB_FAILED", message: expect.stringContaining("nightly-cron") }),
                expect.objectContaining({ type: "ACCOUNT_NEGATIVE", target: { kind: "accountDashboard", accountId: TEST_ACCOUNT_ID } }),
            ]));
            expect(notifications).toHaveLength(4);
        });

        it("only considers the latest outcome of each job: a backup re-run successfully is no longer failed", async () => {
            const logService = new JobExecutionLogService(testDataSource.manager);
            await logService.logError(BACKUP_DB_JOB_NAME, "boom");
            await logService.logSuccess(BACKUP_DB_JOB_NAME, "ok");
            await logService.logInfo(BACKUP_DB_JOB_NAME, "Temporary directory removed");

            const notifications = await new NotificationService().getForUser(TEST_USER_ID, NOW);

            expect(notifications.map((notification) => notification.type)).toEqual(["BACKUP_SUCCEEDED"]);
        });
    });
});
