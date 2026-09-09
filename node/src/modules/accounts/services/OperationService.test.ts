import { beforeEach, describe, expect, it, vi } from "vitest";
import { Account } from "../entities/Account";
import { AccountLine } from "../entities/AccountLine";
import OperationService from "./OperationService";
import { BanquePostaleOperationImport } from "../../externals/entities/BanquePostaleImport";

const { getRepositoryMock, transactionMock } = vi.hoisted(() => ({
    getRepositoryMock: vi.fn(),
    transactionMock: vi.fn()
}));

vi.mock("../../../db/dataSource", () => ({
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
    let storedImportedOperations: Array<{
        id: number;
        accountId: number;
        accountLineId: number | null;
        amount: number;
        dateOperation: string;
    }>;

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
        find: vi.fn(async (options?: {
            where?: {
                transferGroupId?: string | { _type: string; _value: string[] };
                id?: number;
                account?: { id: number };
                label?: { _type: string; _value: string };
            };
        }) => {
            const where = options?.where ?? {};
            const transferGroupFilter = where.transferGroupId;
            const transferGroupIds = typeof transferGroupFilter === "object" && transferGroupFilter !== null && "_value" in transferGroupFilter
                ? transferGroupFilter._value
                : undefined;
            const transferGroupIdEquals = typeof transferGroupFilter === "string" ? transferGroupFilter : undefined;
            const labelFilter = typeof where.label === "object" && where.label !== null && "_value" in where.label
                ? where.label._value
                : undefined;
            return storedLines.filter((entry) => {
                if (where.id !== undefined && entry.id !== where.id) return false;
                if (where.account?.id !== undefined && entry.account?.id !== where.account.id) return false;
                if (transferGroupIdEquals !== undefined && entry.transferGroupId !== transferGroupIdEquals) return false;
                if (transferGroupIds !== undefined && !transferGroupIds.includes(entry.transferGroupId as string)) return false;
                if (labelFilter !== undefined && !entry.label?.startsWith(labelFilter.replace(/%$/, ""))) return false;
                return true;
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
        delete: vi.fn(async (criteria: number[] | { id: number; account?: { id: number } }) => {
            if (Array.isArray(criteria)) {
                storedLines = storedLines.filter((entry) => !criteria.includes(entry.id));
            } else {
                storedLines = storedLines.filter((entry) => entry.id !== criteria.id);
            }
        }),
        createQueryBuilder: vi.fn(() => {
            let filterIds: number[] = [];
            let filterAccountId: number | undefined;
            const builder = {
                where: vi.fn((_clause: string, params: { ids: number[] }) => {
                    filterIds = params.ids;
                    return builder;
                }),
                andWhere: vi.fn((_clause: string, params: { accountId: number }) => {
                    filterAccountId = params.accountId;
                    return builder;
                }),
                getMany: vi.fn(async () => storedLines.filter((entry) =>
                    filterIds.includes(entry.id)
                    && (filterAccountId === undefined || entry.account?.id === filterAccountId)
                ))
            };
            return builder;
        })
    };

    const banquePostaleImportRepo = {
        findOne: vi.fn(async ({ where }: { where: { accountLineId?: number } }) => {
            if (where.accountLineId === undefined) return null;
            return storedImportedOperations.find((entry) => entry.accountLineId === where.accountLineId) ?? null;
        }),
        find: vi.fn(async ({ where }: {
            where: { accountId: number; amount: number; dateOperation: Date | string; accountLineId: { _type: string } }
        }) => {
            const whereDate = where.dateOperation instanceof Date
                ? where.dateOperation.toISOString().slice(0, 10)
                : where.dateOperation;
            return storedImportedOperations.filter((entry) =>
                entry.accountId === where.accountId
                && entry.amount === where.amount
                && entry.dateOperation === whereDate
                && entry.accountLineId === null
            );
        }),
        save: vi.fn(async (payload: { id: number; accountLineId: number | null }) => {
            storedImportedOperations = storedImportedOperations.map((entry) =>
                entry.id === payload.id ? { ...entry, accountLineId: payload.accountLineId } : entry
            );
            return storedImportedOperations.find((entry) => entry.id === payload.id);
        })
    };

    const userRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => ({ id })),
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => ({ id: where.id })),
        increment: vi.fn(async (criteria: { id: number }, property: string, value: number) => {
            return { raw: [], affected: 1 };
        }),
    };

    const manager = {
        getRepository: vi.fn((entity: { name: string }) => {
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "User") return userRepo;
            if (entity.name === "BanquePostaleOperationImport") return banquePostaleImportRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        })
    };

    beforeEach(() => {
        nextId = 1;
        storedLines = [];
        storedImportedOperations = [];
        vi.clearAllMocks();

        getRepositoryMock.mockImplementation((entity: { name: string }) => {
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "User") return userRepo;
            if (entity.name === "BanquePostaleOperationImport") return banquePostaleImportRepo;
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
            natureId: null,
            posteId: null
        }, 1, 1);

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
        expect(mirror?.posteId ?? null).toBeNull();
    });

    it("syncs amounts to the sibling but preserves its business fields when editing an existing transfer", async () => {
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
            targetAccount: { id: 2 },
            dateValeur: null,
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(savedLine.id).toBe(10);
        expect(storedLines).toHaveLength(2);

        const sibling = storedLines.find((line) => line.id === 11);
        expect(sibling?.account?.id).toBe(2);
        expect(sibling?.targetAccount?.id).toBe(1);
        // Les montants du miroir suivent la ligne source (inversés)
        expect(Number(sibling?.credit)).toBe(80);
        expect(Number(sibling?.debit)).toBe(0);
        // Le label du miroir n'est jamais écrasé par celui de la source
        expect(sibling?.label).toBe("Ancien virement");
        expect(sibling?.transferGroupId).toBe("group-1");
    });

    it("updates the sibling line when the transfer target account changes", async () => {
        storedLines = [
            {
                id: 40,
                label: "Virement",
                dateOperation: new Date("2026-03-10"),
                debit: 50,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: accounts[1],
                transferGroupId: "group-4",
                dateValeur: null
            },
            {
                id: 41,
                label: "Virement",
                dateOperation: new Date("2026-03-10"),
                debit: 0,
                credit: 50,
                isChecked: false,
                account: accounts[1],
                targetAccount: accounts[0],
                transferGroupId: "group-4",
                dateValeur: null
            }
        ];
        nextId = 42;

        const service = new OperationService();

        await service.save({
            id: 40,
            label: "Virement vers voyage",
            dateOperation: "2026-03-20",
            debit: 80,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 3 },
            dateValeur: null,
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(storedLines).toHaveLength(2);

        const sibling = storedLines.find((line) => line.id === 41);
        expect(sibling?.account?.id).toBe(3);
        expect(sibling?.targetAccount?.id).toBe(1);
        expect(Number(sibling?.credit)).toBe(80);
        expect(Number(sibling?.debit)).toBe(0);
        expect(sibling?.transferGroupId).toBe("group-4");
        expect(sibling?.posteId ?? null).toBeNull();
    });

    it("rejects a transfer with both debit and credit set (amounts must be strictly mirrored)", async () => {
        const service = new OperationService();

        await expect(service.save({
            label: "Virement ambigu",
            dateOperation: "2026-03-18",
            debit: 100,
            credit: 40,
            isChecked: false,
            targetAccount: { id: 2 },
            dateValeur: null,
            natureId: null,
            posteId: null
        }, 1, 1)).rejects.toMatchObject({ code: "OPERATION_TRANSFER_VALIDATION", statusCode: 400 });
    });

    it("rejects a transfer without any amount", async () => {
        const service = new OperationService();

        await expect(service.save({
            label: "Virement vide",
            dateOperation: "2026-03-18",
            debit: 0,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 2 },
            dateValeur: null,
            natureId: null,
            posteId: null
        }, 1, 1)).rejects.toMatchObject({ code: "OPERATION_TRANSFER_VALIDATION", statusCode: 400 });
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
            natureId: null,
            posteId: null
        }, 1, 1)).rejects.toMatchObject({ code: "OPERATION_TRANSFER_SAME_ACCOUNT", statusCode: 400 });
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
            natureId: null,
            posteId: null
        }, 1, 1);

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
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(savedLine.targetAccount?.id).toBe(2);
        expect(savedLine.transferGroupId).toBeTruthy();
        expect(storedLines).toHaveLength(2);

        const mirror = storedLines.find((line) => line.id !== 30);
        expect(mirror?.account?.id).toBe(2);
        expect(Number(mirror?.credit)).toBe(90);
        expect(mirror?.transferGroupId).toBe(savedLine.transferGroupId);
    });

    it("awards creation XP when creating a new operation", async () => {
        const service = new OperationService();

        await service.save({
            label: "Nouvelle operation",
            dateOperation: "2026-03-25",
            debit: 42,
            credit: 0,
            isChecked: false,
            targetAccount: null,
            dateValeur: null,
            natureId: null,
            posteId: null
        }, 1, 15);

        expect(userRepo.increment).toHaveBeenCalledWith({ id: 15 }, "totalXp", 5);
    });

    it("awards validation XP when adding dateValeur on update", async () => {
        storedLines = [
            {
                id: 100,
                label: "Operation a valider",
                dateOperation: new Date("2026-03-10"),
                debit: 50,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: null,
                transferGroupId: null,
                dateValeur: null
            }
        ];
        nextId = 101;

        const service = new OperationService();

        await service.save({
            id: 100,
            label: "Operation validee",
            dateOperation: "2026-03-10",
            debit: 50,
            credit: 0,
            isChecked: true,
            targetAccount: null,
            dateValeur: "2026-03-21",
            natureId: null,
            posteId: null
        }, 1, 20);

        expect(userRepo.increment).toHaveBeenCalledTimes(1);
        expect(userRepo.increment).toHaveBeenCalledWith({ id: 20 }, "totalXp", 20);
    });

    it("propagates amounts, dateOperation and check state to the sibling on transfer edit", async () => {
        storedLines = [
            {
                id: 50,
                label: "Virement",
                dateOperation: new Date("2026-03-10"),
                debit: 50,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: accounts[1],
                transferGroupId: "group-5",
                dateValeur: null
            },
            {
                id: 51,
                label: "Virement (coté épargne)",
                dateOperation: new Date("2026-03-10"),
                debit: 0,
                credit: 50,
                isChecked: false,
                account: accounts[1],
                targetAccount: accounts[0],
                transferGroupId: "group-5",
                dateValeur: null
            }
        ];
        nextId = 52;

        const service = new OperationService();

        await service.save({
            id: 50,
            label: "Virement renommé",
            dateOperation: "2026-03-22",
            debit: 200,
            credit: 0,
            isChecked: true,
            targetAccount: { id: 2 },
            dateValeur: "2026-03-23",
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(storedLines).toHaveLength(2);

        const sibling = storedLines.find((line) => line.id === 51);
        // Montants inversés et propagés
        expect(Number(sibling?.credit)).toBe(200);
        expect(Number(sibling?.debit)).toBe(0);
        // Dates et statut propagés
        expect(sibling?.isChecked).toBe(true);
        expect(sibling?.dateValeur).toBeTruthy();
        expect((sibling?.dateOperation as Date).toISOString().slice(0, 10)).toBe("2026-03-22");
        // Choix métier du miroir préservés
        expect(sibling?.label).toBe("Virement (coté épargne)");
        expect(sibling?.transferGroupId).toBe("group-5");
    });

    it("recreates a missing mirror when editing a transfer whose sibling is gone", async () => {
        storedLines = [
            {
                id: 60,
                label: "Virement orphelin",
                dateOperation: new Date("2026-03-10"),
                debit: 70,
                credit: 0,
                isChecked: false,
                account: accounts[0],
                targetAccount: accounts[1],
                transferGroupId: "group-6",
                dateValeur: null
            }
        ];
        nextId = 61;

        const service = new OperationService();

        await service.save({
            id: 60,
            label: "Virement orphelin",
            dateOperation: "2026-03-10",
            debit: 70,
            credit: 0,
            isChecked: false,
            targetAccount: { id: 2 },
            dateValeur: null,
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(storedLines).toHaveLength(2);
        const mirror = storedLines.find((line) => line.id !== 60);
        expect(mirror?.account?.id).toBe(2);
        expect(Number(mirror?.credit)).toBe(70);
        expect(mirror?.transferGroupId).toBe("group-6");
    });

    it("links one import line when saving a validated operation with exact dateValeur", async () => {
        storedImportedOperations = [
            { id: 1, accountId: 1, amount: -100, dateOperation: "2026-03-21", accountLineId: null }
        ];

        const service = new OperationService();
        const saved = await service.save({
            label: "Facture",
            dateOperation: "2026-03-20",
            dateValeur: "2026-03-21",
            source: "manual",
            debit: 100,
            credit: 0,
            isChecked: true,
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(saved.id).toBeGreaterThan(0);
        expect(storedImportedOperations[0].accountLineId).toBe(saved.id);
    });

    it("does not link import line when saving a validated operation with different dateValeur", async () => {
        storedImportedOperations = [
            { id: 1, accountId: 1, amount: -100, dateOperation: "2026-03-22", accountLineId: null }
        ];

        const service = new OperationService();
        await service.save({
            label: "Facture",
            dateOperation: "2026-03-20",
            dateValeur: "2026-03-21",
            source: "manual",
            debit: 100,
            credit: 0,
            isChecked: true,
            natureId: null,
            posteId: null
        }, 1, 1);

        expect(storedImportedOperations[0].accountLineId).toBeNull();
    });
});

describe("OperationService.delete - transfer groups", () => {
    let nextId: number;
    let storedLines: StoredLine[];

    const accounts: Account[] = [
        { id: 1, label: "Compte principal" } as Account,
        { id: 2, label: "Epargne" } as Account,
    ];

    const accountRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => accounts.find((account) => account.id === id) ?? null)
    };

    const accountLineRepo = {
        findOne: vi.fn(async ({ where }: { where: { id: number; account?: { id: number } } }) => {
            const line = storedLines.find((entry) =>
                entry.id === where.id
                && (where.account === undefined || entry.account?.id === where.account.id)
            );
            return line ? { ...line } : null;
        }),
        find: vi.fn(async (options?: { where?: { transferGroupId?: string } }) => {
            return storedLines
                .filter((entry) => options?.where?.transferGroupId === undefined || entry.transferGroupId === options.where.transferGroupId)
                .map((entry) => ({ ...entry }));
        }),
        delete: vi.fn(async (criteria: number[]) => {
            storedLines = storedLines.filter((entry) => !criteria.includes(entry.id));
            return { affected: criteria.length };
        })
    };

    const userRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => ({ id })),
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => ({ id: where.id })),
        increment: vi.fn(async () => ({ raw: [], affected: 1 })),
    };

    const manager = {
        getRepository: vi.fn((entity: { name: string }) => {
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "User") return userRepo;
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
            if (entity.name === "User") return userRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        });

        transactionMock.mockImplementation(async (callback: (mgr: typeof manager) => Promise<unknown>) => callback(manager));
    });

    it("deletes the mirror line when deleting a transfer", async () => {
        storedLines = [
            { id: 1, label: "Virement", debit: 100, credit: 0, account: accounts[0], targetAccount: accounts[1], transferGroupId: "group-del", dateOperation: new Date(), dateValeur: null, isChecked: false },
            { id: 2, label: "Virement", debit: 0, credit: 100, account: accounts[1], targetAccount: accounts[0], transferGroupId: "group-del", dateOperation: new Date(), dateValeur: null, isChecked: false }
        ];
        nextId = 3;

        const service = new OperationService();
        await service.delete(1, 1);

        expect(storedLines).toHaveLength(0);
        expect(accountLineRepo.delete).toHaveBeenCalledWith([1, 2]);
    });

    it("deletes only the line itself when it is not a transfer", async () => {
        storedLines = [
            { id: 1, label: "Simple", debit: 100, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date(), dateValeur: null, isChecked: false },
            { id: 2, label: "Autre", debit: 0, credit: 100, account: accounts[1], targetAccount: null, transferGroupId: null, dateOperation: new Date(), dateValeur: null, isChecked: false }
        ];
        nextId = 3;

        const service = new OperationService();
        await service.delete(1, 1);

        expect(storedLines).toHaveLength(1);
        expect(storedLines[0].id).toBe(2);
    });

    it("throws 404 when deleting a line from another account", async () => {
        storedLines = [
            { id: 1, label: "Virement", debit: 100, credit: 0, account: accounts[1], targetAccount: accounts[0], transferGroupId: "group-del", dateOperation: new Date(), dateValeur: null, isChecked: false }
        ];

        const service = new OperationService();
        await expect(service.delete(1, 1)).rejects.toMatchObject({ code: "OPERATION_NOT_FOUND", statusCode: 404 });
        expect(storedLines).toHaveLength(1);
    });
});

describe("OperationService.duplicateLine - transfer groups", () => {
    let nextId: number;
    let storedLines: StoredLine[];

    const accounts: Account[] = [
        { id: 1, label: "Compte principal" } as Account,
        { id: 2, label: "Epargne" } as Account,
    ];

    const accountRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => accounts.find((account) => account.id === id) ?? null)
    };

    const accountLineRepo = {
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => {
            const line = storedLines.find((entry) => entry.id === where.id);
            return line ? { ...line } : null;
        }),
        findOneBy: vi.fn(async (where: { id?: number }) => {
            return storedLines.find((entry) => where.id === undefined || entry.id === where.id) ?? null;
        }),
        find: vi.fn(async (options?: { where?: { label?: { _value: string }; account?: { id: number } } }) => {
            const labelPrefix = options?.where?.label?._value?.replace(/%$/, "");
            return storedLines
                .filter((entry) => {
                    if (options?.where?.account?.id !== undefined && entry.account?.id !== options.where.account.id) return false;
                    if (labelPrefix !== undefined && !entry.label?.startsWith(labelPrefix)) return false;
                    return true;
                })
                .map((entry) => ({ ...entry }));
        }),
        save: vi.fn(async (payload: Partial<AccountLine>) => {
            const created = { id: nextId++, ...payload } as StoredLine;
            storedLines.push(created);
            return created;
        })
    };

    const userRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => ({ id })),
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => ({ id: where.id })),
        increment: vi.fn(async () => ({ raw: [], affected: 1 })),
    };

    const manager = {
        getRepository: vi.fn((entity: { name: string }) => {
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "User") return userRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        })
    };

    beforeEach(() => {
        nextId = 10;
        storedLines = [];
        vi.clearAllMocks();

        getRepositoryMock.mockImplementation((entity: { name: string }) => {
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "User") return userRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        });

        transactionMock.mockImplementation(async (callback: (mgr: typeof manager) => Promise<unknown>) => callback(manager));
    });

    it("duplicates a transfer as a complete new pair with its own transferGroupId", async () => {
        storedLines = [
            { id: 1, label: "Virement", debit: 150, credit: 0, account: accounts[0], targetAccount: accounts[1], transferGroupId: "group-orig", dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false, source: "manual" },
            { id: 2, label: "Virement", debit: 0, credit: 150, account: accounts[1], targetAccount: accounts[0], transferGroupId: "group-orig", dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false, source: "manual" }
        ];

        const service = new OperationService();
        const duplicated = await service.duplicateLine(1, 1);

        expect(storedLines).toHaveLength(4);
        expect(duplicated.label).toBe("Virement (1)");
        expect(duplicated.transferGroupId).toBeTruthy();
        expect(duplicated.transferGroupId).not.toBe("group-orig");

        // Le nouveau groupe ne contient que les 2 nouvelles lignes
        const newGroupLines = storedLines.filter((line) => line.transferGroupId === duplicated.transferGroupId);
        expect(newGroupLines).toHaveLength(2);

        const newMirror = newGroupLines.find((line) => line.id !== duplicated.id);
        expect(newMirror?.account?.id).toBe(2);
        expect(newMirror?.targetAccount?.id).toBe(1);
        expect(Number(newMirror?.credit)).toBe(150);
        expect(Number(newMirror?.debit)).toBe(0);

        // L'ancien groupe reste intact
        const oldGroupLines = storedLines.filter((line) => line.transferGroupId === "group-orig");
        expect(oldGroupLines).toHaveLength(2);
    });

    it("resets the check state on duplication", async () => {
        storedLines = [
            { id: 1, label: "Dépense", debit: 40, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-01"), dateValeur: new Date("2026-03-02"), isChecked: true, source: "manual" }
        ];

        const service = new OperationService();
        const duplicated = await service.duplicateLine(1, 1);

        expect(duplicated.isChecked).toBe(false);
        expect(duplicated.dateValeur).toBeNull();
        expect(storedLines).toHaveLength(2);
    });

    it("increments the label suffix based on existing copies", async () => {
        storedLines = [
            { id: 1, label: "Dépense", debit: 40, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date(), dateValeur: null, isChecked: false, source: "manual" },
            { id: 2, label: "Dépense (1)", debit: 40, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date(), dateValeur: null, isChecked: false, source: "manual" }
        ];

        const service = new OperationService();
        const duplicated = await service.duplicateLine(1, 1);

        expect(duplicated.label).toBe("Dépense (2)");
    });
});

describe("OperationService.checkBatch - transfer groups", () => {
    let storedLines: StoredLine[];
    let storedImportedOperations: Array<{
        id: number;
        accountId: number;
        accountLineId: number | null;
        amount: number;
        dateOperation: string;
    }>;

    const accounts: Account[] = [
        { id: 1, label: "Compte principal" } as Account,
        { id: 2, label: "Epargne" } as Account,
    ];

    const accountRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => accounts.find((account) => account.id === id) ?? null)
    };

    const accountLineRepo = {
        findOneBy: vi.fn(async (where: { id?: number }) => {
            return storedLines.find((entry) => where.id === undefined || entry.id === where.id) ?? null;
        }),
        findBy: vi.fn(async (where: { id?: { _type: string; _value: number[] } | number[] }) => {
            const ids = Array.isArray(where.id) ? where.id : where.id?._value;
            return storedLines
                .filter((entry) => ids === undefined || ids.includes(entry.id))
                .map((entry) => ({ ...entry }));
        }),
        find: vi.fn(async (options?: { where?: { transferGroupId?: { _value: string[] } } }) => {
            const groupIds = options?.where?.transferGroupId?._value;
            return storedLines
                .filter((entry) => groupIds === undefined || groupIds.includes(entry.transferGroupId as string))
                .map((entry) => ({ ...entry }));
        }),
        save: vi.fn(async (payload: Partial<AccountLine> | Partial<AccountLine>[]) => {
            const payloads = Array.isArray(payload) ? payload : [payload];
            for (const item of payloads) {
                if (item.id) {
                    storedLines = storedLines.map((entry) => entry.id === item.id ? { ...entry, ...item } : entry);
                }
            }
            return payload;
        }),
        createQueryBuilder: vi.fn(() => {
            let filterIds: number[] = [];
            let filterAccountId: number | undefined;
            const builder = {
                where: vi.fn((_clause: string, params: { ids: number[] }) => {
                    filterIds = params.ids;
                    return builder;
                }),
                andWhere: vi.fn((_clause: string, params: { accountId: number }) => {
                    filterAccountId = params.accountId;
                    return builder;
                }),
                getMany: vi.fn(async () => storedLines.filter((entry) =>
                    filterIds.includes(entry.id)
                    && (filterAccountId === undefined || entry.account?.id === filterAccountId)
                ))
            };
            return builder;
        })
    };

    const userRepo = {
        findOneBy: vi.fn(async ({ id }: { id: number }) => ({ id })),
        findOne: vi.fn(async ({ where }: { where: { id: number } }) => ({ id: where.id })),
        increment: vi.fn(async () => ({ raw: [], affected: 1 })),
    };

    const banquePostaleImportRepo = {
        findOne: vi.fn(async ({ where }: { where: { accountLineId?: number } }) => {
            if (where.accountLineId === undefined) return null;
            return storedImportedOperations.find((entry) => entry.accountLineId === where.accountLineId) ?? null;
        }),
        find: vi.fn(async ({ where }: {
            where: { accountId: number; amount: number; dateOperation: Date | string; accountLineId: { _type: string } }
        }) => {
            const whereDate = where.dateOperation instanceof Date
                ? where.dateOperation.toISOString().slice(0, 10)
                : where.dateOperation;
            return storedImportedOperations.filter((entry) =>
                entry.accountId === where.accountId
                && entry.amount === where.amount
                && entry.dateOperation === whereDate
                && entry.accountLineId === null
            );
        }),
        save: vi.fn(async (payload: { id: number; accountLineId: number | null }) => {
            storedImportedOperations = storedImportedOperations.map((entry) =>
                entry.id === payload.id ? { ...entry, accountLineId: payload.accountLineId } : entry
            );
            return storedImportedOperations.find((entry) => entry.id === payload.id);
        })
    };

    const manager = {
        getRepository: vi.fn((entity: { name: string }) => {
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "User") return userRepo;
            if (entity.name === "BanquePostaleOperationImport") return banquePostaleImportRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        })
    };

    beforeEach(() => {
        storedLines = [];
        storedImportedOperations = [];
        vi.clearAllMocks();

        getRepositoryMock.mockImplementation((entity: { name: string }) => {
            if (entity.name === "AccountLine") return accountLineRepo;
            if (entity.name === "Account") return accountRepo;
            if (entity.name === "User") return userRepo;
            if (entity.name === "BanquePostaleOperationImport") return banquePostaleImportRepo;
            throw new Error(`Repository non mocke: ${entity.name}`);
        });

        transactionMock.mockImplementation(async (callback: (mgr: typeof manager) => Promise<unknown>) => callback(manager));
    });

    it("propagates the check state to the mirror line of a transfer", async () => {
        storedLines = [
            { id: 1, label: "Virement", debit: 100, credit: 0, account: accounts[0], targetAccount: accounts[1], transferGroupId: "group-check", dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false },
            { id: 2, label: "Virement", debit: 0, credit: 100, account: accounts[1], targetAccount: accounts[0], transferGroupId: "group-check", dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false }
        ];

        const service = new OperationService();
        const result = await service.checkBatch({
            checks: [{ id: 1, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);

        expect(result.updatedCount).toBe(1);

        const primary = storedLines.find((line) => line.id === 1);
        const mirror = storedLines.find((line) => line.id === 2);
        expect(primary?.isChecked).toBe(true);
        expect(mirror?.isChecked).toBe(true);
        expect(mirror?.dateValeur).toBeTruthy();
        // Les montants ne sont jamais modifiés par un check
        expect(Number(mirror?.credit)).toBe(100);
    });

    it("does not touch other transfer groups when checking a simple operation", async () => {
        storedLines = [
            { id: 1, label: "Simple", debit: 30, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false },
            { id: 2, label: "Virement", debit: 100, credit: 0, account: accounts[0], targetAccount: accounts[1], transferGroupId: "group-check", dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false },
            { id: 3, label: "Virement", debit: 0, credit: 100, account: accounts[1], targetAccount: accounts[0], transferGroupId: "group-check", dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false }
        ];

        const service = new OperationService();
        await service.checkBatch({
            checks: [{ id: 1, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);

        const mirror = storedLines.find((line) => line.id === 3);
        expect(mirror?.isChecked).toBe(false);
        expect(mirror?.dateValeur).toBeNull();
    });

    it("links one import line when exactly one strict candidate exists", async () => {
        storedLines = [
            { id: 1, label: "Simple", debit: 100, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false }
        ];
        storedImportedOperations = [
            { id: 10, accountId: 1, amount: -100, dateOperation: "2026-03-05", accountLineId: null }
        ];

        const service = new OperationService();
        await service.checkBatch({
            checks: [{ id: 1, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);

        expect(storedImportedOperations[0].accountLineId).toBe(1);
    });

    it("does not link when strict matching date differs", async () => {
        storedLines = [
            { id: 1, label: "Simple", debit: 100, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false }
        ];
        storedImportedOperations = [
            { id: 10, accountId: 1, amount: -100, dateOperation: "2026-03-06", accountLineId: null }
        ];

        const service = new OperationService();
        await service.checkBatch({
            checks: [{ id: 1, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);

        expect(storedImportedOperations[0].accountLineId).toBeNull();
    });

    it("does not link when multiple strict candidates exist", async () => {
        storedLines = [
            { id: 1, label: "Simple", debit: 100, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false }
        ];
        storedImportedOperations = [
            { id: 10, accountId: 1, amount: -100, dateOperation: "2026-03-05", accountLineId: null },
            { id: 11, accountId: 1, amount: -100, dateOperation: "2026-03-05", accountLineId: null }
        ];

        const service = new OperationService();
        await service.checkBatch({
            checks: [{ id: 1, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);

        expect(storedImportedOperations.every((entry) => entry.accountLineId === null)).toBe(true);
    });

    it("does not double-link one import candidate to multiple account lines", async () => {
        storedLines = [
            { id: 1, label: "Simple 1", debit: 100, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-01"), dateValeur: null, isChecked: false },
            { id: 2, label: "Simple 2", debit: 100, credit: 0, account: accounts[0], targetAccount: null, transferGroupId: null, dateOperation: new Date("2026-03-02"), dateValeur: null, isChecked: false }
        ];
        storedImportedOperations = [
            { id: 10, accountId: 1, amount: -100, dateOperation: "2026-03-05", accountLineId: null }
        ];

        const service = new OperationService();
        await service.checkBatch({
            checks: [{ id: 1, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);
        await service.checkBatch({
            checks: [{ id: 2, isChecked: true, dateValeur: "2026-03-05" }]
        }, 1, 1);

        expect(storedImportedOperations[0].accountLineId).toBe(1);
    });
});
