import { describe, expect, it, vi } from "vitest";
import type { EntityManager } from "typeorm";
import { runInTransaction } from "./transaction";

function fakeManager(isTransactionActive: boolean | undefined) {
    const transaction = vi.fn(async (work: (manager: EntityManager) => Promise<unknown>) => work(manager));
    const manager = {
        queryRunner: isTransactionActive === undefined ? undefined : { isTransactionActive },
        transaction,
    } as unknown as EntityManager;
    return { manager, transaction };
}

describe("runInTransaction", () => {
    it("réutilise la transaction active sans en ouvrir une nouvelle", async () => {
        const { manager, transaction } = fakeManager(true);

        const result = await runInTransaction(manager, async (m) => (m === manager ? "ok" : "ko"));

        expect(result).toBe("ok");
        expect(transaction).not.toHaveBeenCalled();
    });

    it("ouvre une transaction quand aucune n'est active", async () => {
        const { manager, transaction } = fakeManager(undefined);

        await runInTransaction(manager, async () => "ok");

        expect(transaction).toHaveBeenCalledTimes(1);
    });

    it("ouvre une transaction quand le query runner n'a pas de transaction active", async () => {
        const { manager, transaction } = fakeManager(false);

        await runInTransaction(manager, async () => "ok");

        expect(transaction).toHaveBeenCalledTimes(1);
    });

    it("propage les erreurs de la transaction englobante", async () => {
        const { manager } = fakeManager(true);

        await expect(runInTransaction(manager, async () => {
            throw new Error("boom");
        })).rejects.toThrow("boom");
    });
});
