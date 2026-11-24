import { describe, expect, it } from "vitest";
import { TEST_ACCOUNT_ID, fixtures, testDataSource } from "../../tests/testDbSetup";
import { Account } from "../../modules/accounts/entities/Account";
import { AccountLine } from "../../modules/accounts/entities/AccountLine";
import { KanbanColumn } from "../../modules/kanban/entities/KanbanColumn";
import { StockItem } from "../../modules/stocks/entities/StockItem";
import { User } from "../../modules/core/entities/User";

describe("Fixtures", () => {
    it("persists an entity with sensible defaults", async () => {
        const item = await fixtures.stockItems.create();

        await expect(testDataSource.getRepository(StockItem).findOneBy({ id: item.id }))
            .resolves.toMatchObject({ id: item.id, label: expect.any(String), defaultUnit: expect.any(String) });
    });

    it("lets overrides win over defaults", async () => {
        const line = await fixtures.accountLines.create({ accountId: TEST_ACCOUNT_ID, label: "Café", debit: 4.5 });

        await expect(testDataSource.getRepository(AccountLine).findOneBy({ id: line.id }))
            .resolves.toMatchObject({ accountId: TEST_ACCOUNT_ID, label: "Café", debit: 4.5, credit: 0, isChecked: false });
    });

    it("generates unique values so successive creations never collide", async () => {
        const [first, second] = await fixtures.users.createMany(2);

        expect(first.username).not.toBe(second.username);
        await expect(testDataSource.getRepository(User).count()).resolves.toBe(3);
    });

    it("picks the next free id or order when the database does not generate it", async () => {
        const account = await fixtures.accounts.create();
        const [firstColumn, secondColumn] = await fixtures.kanbanColumns.createMany(2);

        expect(account.id).toBe(TEST_ACCOUNT_ID + 1);
        await expect(testDataSource.getRepository(Account).count()).resolves.toBe(2);
        expect(secondColumn.order).toBe(firstColumn.order + 1);
        await expect(testDataSource.getRepository(KanbanColumn).count()).resolves.toBe(2);
    });

    it("creates many entities with per-index overrides", async () => {
        const lines = await fixtures.accountLines.createMany(3, (index) => ({
            accountId: TEST_ACCOUNT_ID,
            debit: 10 + index,
        }));

        expect(lines.map((line) => line.debit)).toEqual([10, 11, 12]);
    });

    it("creates one entity per given input, in order", async () => {
        const items = await fixtures.stockItems.createEach([{ label: "Riz" }, { label: "Lait", defaultUnit: "L" }]);

        expect(items.map((item) => [item.label, item.defaultUnit])).toEqual([["Riz", "u"], ["Lait", "L"]]);
        expect(items[0].id).toBeLessThan(items[1].id);
    });
});
