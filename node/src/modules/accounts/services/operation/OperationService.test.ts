import { beforeEach, describe, expect, it, vi } from "vitest";
import { Account } from "../../entities/Account";
import { AccountLine } from "../../entities/AccountLine";
import OperationService from "./OperationService";

const { getRepositoryMock, transactionMock } = vi.hoisted(() => ({
    getRepositoryMock: vi.fn(),
    transactionMock: vi.fn()
}));

vi.mock("../../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: getRepositoryMock,
        transaction: transactionMock,
        manager: {
            getRepository: getRepositoryMock
        }
    }
}));

type StoredLine = Partial<AccountLine> & { id: number };

describe("OperationService.save - transfer groups", () => {
    let nextId: number;
    let storedLines: StoredLine[];

    const accounts: Account[] = [
        { id: 1, label: "Compte principal" } as Account,
        { id: 2, label: "Epargne" } as Account,
        { id: 3, label: "Voyage" } as Account,
    ];

    const accountRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => accounts.find((account) => account.id === id) ?? null)
    };

    const accountLineRepo = {
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => {
            const line = storedLines.find((entry) => entry.id === where.id);
            return line ? { ...line } : null;
        }),
        findOneBy: vi.fn(async (where: { id?: number; transferGroupId?: string; }) => {
            return storedLines.find((entry) => {
                const idMatches = where.id === undefined || entry.id === where.id;
                const groupMatches = where.transferGroupId === undefined || entry.transferGroupId === where.transferGroupId;
                return idMatches && groupMatches;
            }) ?? null;
        }),
        findBy: vi.fn(async (where: { transferGroupId?: string; id?: number[] }) => {
            return storedLines.filter((entry) => {
                const groupMatches = where.transferGroupId === undefined || entry.transferGroupId === where.transferGroupId;
                const idMatches = where.id === undefined || where.id.includes(entry.id);
                return groupMatches && idMatches;
            }).map((entry) => ({ ...entry }));
        }),
        findOneOrFail: vi.fn(async ({ where }: { where: { id: number } }) => {
            const line = storedLines.find((entry) => entry.id === where.id);
            if (!line) {
                throw new Error(`Line not found: ${where.id}`);
            }
            return { ...line };
        }),
        save: vi.fn(async (payload: Partial<AccountLine>) => {
            if (payload.id) {
                storedLines = storedLines.map((entry) => entry.id === payload.id ? { ...entry, ...payload } : entry);
                return storedLines.find((entry) => entry.id === payload.id) as StoredLine;
            }

            const created = { id: nextId++, ...payload } as StoredLine;
            storedLines.push(created);
            return created;
        }),
        delete: vi.fn(async (criteria: number[]) => {
            storedLines = storedLines.filter((entry) => !criteria.includes(entry.id));
        })
    };

    const manager = {
        getRepository: vi.fn((entity: { name: string }) => {
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "AccountLine") return accountLineRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        })
    };

    beforeEach(() => {
        nextId = 1;
        storedLines = [];
        vi.clearAllMocks();

        getRepositoryMock.mockImplementation((entity: { name: string }) => {
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "Account") return accountRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        });

        transactionMock.mockImplementation(async (callback: (mgr: typeof manager) => Promise<unknown>) => callback(manager));
    });

    it("creates two mirrored lines linked by the same transferGroupId", async () => {
        const service = new OperationService();

        const savedLine = await service.save({
            label: "Virement vers epargne",
            dateOperation: "2026-03-18",
            debit: 125,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 2 },
            dateValeur: null,
            nature: null,
            poste: null
        }, 1);

        expect(savedLine.account?.id).toBe(1);
        expect(savedLine.targetAccount?.id).toBe(2);
        expect(savedLine.transferGroupId).toBeTruthy();
        expect(storedLines).toHaveLength(2);

        const mirror = storedLines.find((line) => line.id !== savedLine.id);
        expect(mirror?.account?.id).toBe(2);
        expect(mirror?.targetAccount?.id).toBe(1);
        expect(Number(mirror?.debit)).toBe(0);
        expect(Number(mirror?.credit)).toBe(125);
        expect(mirror?.transferGroupId).toBe(savedLine.transferGroupId);
    });

    it("updates the sibling line instead of creating a third line", async () => {
        storedLines = [
            {
                id: 10,
                label: "Ancien virement",
                dateOperation: new Date("2026-03-10"),
                debit: 50,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: accounts[1],
                transferGroupId: "group-1",
                dateValeur: null
            },
            {
                id: 11,
                label: "Ancien virement",
                dateOperation: new Date("2026-03-10"),
                debit: 0,
                credit: 50,
                isChecked: false,
                account: accounts[1],
                targetAccount: accounts[0],
                transferGroupId: "group-1",
                dateValeur: null
            }
        ];
        nextId = 12;

        const service = new OperationService();

        const savedLine = await service.save({
            id: 10,
            label: "Virement maj",
            dateOperation: "2026-03-20",
            debit: 80,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 3 },
            dateValeur: null,
            nature: null,
            poste: null
        }, 1);

        expect(savedLine.id).toBe(10);
        expect(storedLines).toHaveLength(2);

        const sibling = storedLines.find((line) => line.id === 11);
        expect(sibling?.account?.id).toBe(3);
        expect(sibling?.targetAccount?.id).toBe(1);
        expect(Number(sibling?.credit)).toBe(80);
        expect(Number(sibling?.debit)).toBe(0);
        expect(sibling?.transferGroupId).toBe("group-1");
    });

    it("rejects a transfer to the same account", async () => {
        const service = new OperationService();

        await expect(service.save({
            label: "Virement invalide",
            dateOperation: "2026-03-18",
            debit: 10,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 1 },
            dateValeur: null,
            nature: null,
            poste: null
        }, 1)).rejects.toMatchObject({ code: "OPERATION_TRANSFER_SAME_ACCOUNT", statusCode: 400 });
    });

    it("removes mirror line when targetAccount is cleared on an existing transfer", async () => {
        storedLines = [
            {
                id: 20,
                label: "Virement",
                dateOperation: new Date("2026-03-10"),
                debit: 60,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: accounts[1],
                transferGroupId: "group-2",
                dateValeur: null
            },
            {
                id: 21,
                label: "Virement",
                dateOperation: new Date("2026-03-10"),
                debit: 0,
                credit: 60,
                isChecked: false,
                account: accounts[1],
                targetAccount: accounts[0],
                transferGroupId: "group-2",
                dateValeur: null
            }
        ];
        nextId = 22;

        const service = new OperationService();

        const savedLine = await service.save({
            id: 20,
            label: "Depense simple",
            dateOperation: "2026-03-10",
            debit: 60,
            credit: 0,
            isChecked: false,
            targetAccount: null,
            dateValeur: null,
            nature: null,
            poste: null
        }, 1);

        expect(savedLine.targetAccount).toBeNull();
        expect(savedLine.transferGroupId).toBeNull();
        expect(storedLines).toHaveLength(1);
        expect(storedLines[0].id).toBe(20);
    });

    it("converts a simple operation to a transfer by adding a targetAccount", async () => {
        storedLines = [
            {
                id: 30,
                label: "Depense simple existante",
                dateOperation: new Date("2026-03-12"),
                debit: 90,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: null,
                transferGroupId: null,
                dateValeur: null
            }
        ];
        nextId = 31;

        const service = new OperationService();

        const savedLine = await service.save({
            id: 30,
            label: "Virement depuis simple",
            dateOperation: "2026-03-12",
            debit: 90,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 2 },
            dateValeur: null,
            nature: null,
            poste: null
        }, 1);

        expect(savedLine.targetAccount?.id).toBe(2);
        expect(savedLine.transferGroupId).toBeTruthy();
        expect(storedLines).toHaveLength(2);

        const mirror = storedLines.find((line) => line.id !== 30);
        expect(mirror?.account?.id).toBe(2);
        expect(Number(mirror?.credit)).toBe(90);
        expect(mirror?.transferGroupId).toBe(savedLine.transferGroupId);
    });
});
