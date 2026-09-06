import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountLine } from "../entities/AccountLine";
import AccountLineService from "./AccountLineService";

const { getRepositoryMock } = vi.hoisted(() => ({
    getRepositoryMock: vi.fn()
}));

vi.mock("../../../db/dataSource", () => ({
    AppDataSource: {
        getRepository: getRepositoryMock
    }
}));

type StoredLine = Partial<AccountLine> & { id: number };

describe("AccountLineService", () => {
    let nextId: number;
    let storedLines: StoredLine[];

    const accountLineRepo = {
        findOneBy: vi.fn(async (where: { id?: number }) => {
            const line = storedLines.find((entry) => where.id === undefined || entry.id === where.id);
            return line ? { ...line } : null;
        }),
        findBy: vi.fn(async (where: { id?: { _type: string; _value: number[] } }) => {
            const ids = where.id?._value ?? [];
            return storedLines.filter((entry) => ids.includes(entry.id));
        }),
        save: vi.fn(async (payload: Partial<AccountLine> | Partial<AccountLine>[]) => {
            const persistOne = (item: Partial<AccountLine>) => {
                if (item.id) {
                    storedLines = storedLines.map((entry) => entry.id === item.id ? { ...entry, ...item } : entry);
                    return storedLines.find((entry) => entry.id === item.id) as StoredLine;
                }
                const created = { id: nextId++, ...item } as StoredLine;
                storedLines.push(created);
                return created;
            };

            if (Array.isArray(payload)) {
                return payload.map(persistOne);
            }
            return persistOne(payload);
        })
    };

    const manager = {
        getRepository: vi.fn(() => accountLineRepo)
    };

    beforeEach(() => {
        nextId = 1;
        storedLines = [];
        vi.clearAllMocks();
    });

    describe("save", () => {
        it("creates a valid line with normalized dates", async () => {
            const service = new AccountLineService(manager as never);

            const saved = await service.save({
                label: "Courses",
                dateOperation: "2026-03-18" as unknown as Date,
                isChecked: false,
                dateValeur: null,
                debit: 25,
                credit: 0
            }) as StoredLine;

            expect(saved.id).toBe(1);
            expect(saved.dateOperation).toBeInstanceOf(Date);
            expect(storedLines).toHaveLength(1);
        });

        it("rejects a checked line without dateValeur", async () => {
            const service = new AccountLineService(manager as never);

            await expect(service.save({
                label: "Invalide",
                dateOperation: "2026-03-18" as unknown as Date,
                isChecked: true,
                dateValeur: null
            })).rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });

            expect(storedLines).toHaveLength(0);
        });

        it("rejects an unchecked line with a dateValeur", async () => {
            const service = new AccountLineService(manager as never);

            await expect(service.save({
                label: "Invalide",
                dateOperation: "2026-03-18" as unknown as Date,
                isChecked: false,
                dateValeur: "2026-03-19" as unknown as Date
            })).rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });
        });

        it("validates the effective state against the persisted line (uncheck existing checked line)", async () => {
            storedLines = [
                {
                    id: 5,
                    label: "Déjà vérifiée",
                    dateOperation: new Date("2026-03-01"),
                    isChecked: true,
                    dateValeur: new Date("2026-03-02")
                }
            ];

            const service = new AccountLineService(manager as never);

            // On décoche sans fournir dateValeur : la date persistée rendrait l'état incohérent.
            await expect(service.save({ id: 5, isChecked: false }))
                .rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });
        });

        it("keeps the persisted check state on partial updates that omit it", async () => {
            storedLines = [
                {
                    id: 6,
                    label: "Ligne vérifiée",
                    dateOperation: new Date("2026-03-01"),
                    isChecked: true,
                    dateValeur: new Date("2026-03-02")
                }
            ];

            const service = new AccountLineService(manager as never);

            const saved = await service.save({ id: 6, label: "Renommée" }) as StoredLine;

            expect(saved.label).toBe("Renommée");
            // L'état persisté n'est pas altéré par une mise à jour partielle
            expect(saved.isChecked).toBe(true);
        });

        it("rejects a transferGroupId without a targetAccount", async () => {
            const service = new AccountLineService(manager as never);

            await expect(service.save({
                label: "Incohérente",
                dateOperation: "2026-03-18" as unknown as Date,
                isChecked: false,
                dateValeur: null,
                transferGroupId: "group-1",
                targetAccount: null
            })).rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });

            expect(storedLines).toHaveLength(0);
        });

        it("rejects a targetAccount without a transferGroupId", async () => {
            const service = new AccountLineService(manager as never);

            await expect(service.save({
                label: "Incohérente",
                dateOperation: "2026-03-18" as unknown as Date,
                isChecked: false,
                dateValeur: null,
                transferGroupId: null,
                targetAccount: { id: 2 } as never
            })).rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });

            expect(storedLines).toHaveLength(0);
        });

        it("accepts a consistent linked operation (transferGroupId + targetAccount)", async () => {
            const service = new AccountLineService(manager as never);

            const saved = await service.save({
                label: "Virement cohérent",
                dateOperation: "2026-03-18" as unknown as Date,
                isChecked: false,
                dateValeur: null,
                transferGroupId: "group-1",
                targetAccount: { id: 2 } as never
            }) as StoredLine;

            expect(saved.id).toBe(1);
            expect(saved.transferGroupId).toBe("group-1");
        });

        it("ignores the transfer pair invariant when neither field is provided (partial update)", async () => {
            storedLines = [
                {
                    id: 7,
                    label: "Ligne liée",
                    dateOperation: new Date("2026-03-01"),
                    isChecked: false,
                    dateValeur: null,
                    transferGroupId: "group-9",
                    targetAccount: { id: 2 } as never
                }
            ];

            const service = new AccountLineService(manager as never);

            // Mise à jour partielle qui ne touche ni transferGroupId ni targetAccount.
            const saved = await service.save({ id: 7, label: "Renommée" }) as StoredLine;
            expect(saved.label).toBe("Renommée");
        });
    });

    describe("saveAll", () => {
        it("persists every line of the batch", async () => {
            const service = new AccountLineService(manager as never);

            const saved = await service.saveAll([
                { label: "A", dateOperation: "2026-03-01" as unknown as Date, isChecked: false, dateValeur: null },
                { label: "B", dateOperation: "2026-03-02" as unknown as Date, isChecked: true, dateValeur: "2026-03-03" as unknown as Date }
            ]) as StoredLine[];

            expect(saved).toHaveLength(2);
            expect(storedLines.map((line) => line.label)).toEqual(["A", "B"]);
        });

        it("rejects the whole batch when one line is inconsistent", async () => {
            const service = new AccountLineService(manager as never);

            await expect(service.saveAll([
                { label: "OK", dateOperation: "2026-03-01" as unknown as Date, isChecked: false, dateValeur: null },
                { label: "KO", dateOperation: "2026-03-02" as unknown as Date, isChecked: true, dateValeur: null }
            ])).rejects.toMatchObject({ code: "OPERATION_VALIDATION", statusCode: 400 });

            // Aucune écriture partielle : la validation précède la persistance.
            expect(accountLineRepo.save).not.toHaveBeenCalled();
        });

        it("updates only the check fields on batch check payloads", async () => {
            storedLines = [
                {
                    id: 1,
                    label: "À vérifier",
                    debit: 42,
                    dateOperation: new Date("2026-03-01"),
                    isChecked: false,
                    dateValeur: null
                }
            ];

            const service = new AccountLineService(manager as never);

            await service.saveAll([
                { id: 1, isChecked: true, dateValeur: "2026-03-05" as unknown as Date }
            ]);

            const updated = storedLines.find((line) => line.id === 1);
            expect(updated?.isChecked).toBe(true);
            expect(updated?.dateValeur).toBeInstanceOf(Date);
            // Le reste de la ligne est inchangé
            expect(updated?.label).toBe("À vérifier");
            expect(Number(updated?.debit)).toBe(42);
        });
    });
});
