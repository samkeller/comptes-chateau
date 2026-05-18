import { ParsedQs } from "qs";
import { randomUUID } from "crypto";
import { AppDataSource } from "../../../../db/dataSource";
import { Account } from "../../entities/Account";
import { AccountLine as AccountLine } from "../../entities/AccountLine";
import AccountLineService from "../AccountLineService";
import TableQueryMapper from "../queryMappers/TableQueryMapper";
import operationTableQueryConfig from "../queryMappers/operationTableQueryConfig";
import TableQueryParser from "../queryMappers/parsers/TableQueryParser";
import { normalizeApiDateInput } from "../../../../utils/ApiDateUtils";
import { OperationBatchCheckPayload, SaveOperationPayload } from "./OperationDtos";
import { badRequest, notFound } from "../../../../utils/AppError";
import { DeleteResult } from "typeorm/query-builder/result/DeleteResult";

const lazyTableQueryParserOptions = {
    allowedSortFields: new Set(Object.keys(operationTableQueryConfig.sortHandlers)),
    allowedFilterFields: new Set(Object.keys(operationTableQueryConfig.filterHandlers)),
    defaultTake: 100,
    maxTake: 200
};

export default class OperationService {
    private accountLineRepo = AppDataSource.getRepository(AccountLine);

    private validateTransferAmounts(line: SaveOperationPayload): void {
        const debit = Number(line.debit ?? 0);
        const credit = Number(line.credit ?? 0);

        if (debit <= 0 && credit <= 0) {
            throw badRequest("OPERATION_TRANSFER_VALIDATION", "Un virement doit avoir un montant strictement positif.");
        }
    }

    private async resolveAccountById(accountId: number, context: string, manager = AppDataSource.manager): Promise<Account> {
        const account = await manager.getRepository(Account).findOneBy({ id: accountId });
        if (!account) {
            throw notFound("ACCOUNT_NOT_FOUND", `${context}: compte introuvable (${accountId}).`);
        }
        return account;
    }

    private buildMirrorLine(line: Partial<AccountLine>, account: Account, targetAccount: Account, transferGroupId: string): Partial<AccountLine> {
        return {
            ...line,
            id: undefined,
            account: targetAccount,
            targetAccount: account,
            transferGroupId,
            poste: null, // Pas de lien entre les postes de comptes différents.
            debit: Number(line.credit ?? 0),
            credit: Number(line.debit ?? 0)
        };
    }

    async getLazy(query: ParsedQs, accountId: number): Promise<{ data: AccountLine[]; totalRecords: number }> {
        const parsedQuery = TableQueryParser.parse(query, lazyTableQueryParserOptions);

        const qb = this.accountLineRepo.createQueryBuilder("al")
            .where("al.account_id = :accountId", { accountId })
            .leftJoinAndSelect("al.account", "account")
            .leftJoinAndSelect("al.targetAccount", "targetAccount")
            .leftJoinAndSelect("al.nature", "nature")
            .leftJoinAndSelect("al.poste", "poste");

        TableQueryMapper.applyFilters(
            qb,
            parsedQuery.filters,
            operationTableQueryConfig.filterHandlers
        );
        TableQueryMapper.applySort(
            qb,
            parsedQuery.sort,
            operationTableQueryConfig.sortHandlers,
            operationTableQueryConfig.defaultSort
        );

        const totalRecords = await qb.clone().getCount();
        qb.skip(parsedQuery.pagination.skip).take(parsedQuery.pagination.take);

        const lines = await qb.getMany();
        return {
            data: lines,
            totalRecords
        };
    }

    async save(line: SaveOperationPayload, accountId: number): Promise<AccountLine> {
        return AppDataSource.transaction(async (manager) => {
            const repo = manager.getRepository(AccountLine);
            const accountLineService = new AccountLineService(manager);

            const existingLine = typeof line.id === "number" && line.id > 0
                ? await repo.findOne({
                    where: { id: line.id, account: { id: accountId } },
                    relations: { account: true, targetAccount: true }
                })
                : null;

            if (line.id && !existingLine) {
                throw notFound("OPERATION_NOT_FOUND", `Operation introuvable: ${line.id}`);
            }

            const account = await this.resolveAccountById(accountId, "Operation.save/account", manager);

            const targetAccountId = line.targetAccount === null
                ? null
                : (line.targetAccount?.id ?? existingLine?.targetAccount?.id ?? null);

            const targetAccount = targetAccountId
                ? await this.resolveAccountById(targetAccountId, "Operation.save/targetAccount", manager)
                : null;

            if (targetAccount && targetAccount.id === account.id) {
                throw badRequest("OPERATION_TRANSFER_SAME_ACCOUNT", "Le compte lié doit etre different du compte source.");
            }

            const primaryLine = {
                ...line,
                account,
                targetAccount,
                transferGroupId: targetAccount ? (existingLine?.transferGroupId ?? randomUUID()) : null
            } as unknown as Partial<AccountLine>;

            if (!targetAccount) {
                // On revient a une operation simple: la ligne courante reste, la ligne miroir disparait.
                const normalizedPrimary = await accountLineService.save({
                    ...primaryLine,
                    targetAccount: null,
                    transferGroupId: null
                }) as AccountLine;

                if (existingLine?.transferGroupId) {
                    const groupedLines = await repo.findBy({ transferGroupId: existingLine.transferGroupId });
                    const siblingIds = groupedLines
                        .filter((groupLine) => groupLine.id !== normalizedPrimary.id)
                        .map((groupLine) => groupLine.id);

                    if (siblingIds.length > 0) {
                        await repo.delete(siblingIds);
                    }
                }

                return repo.findOneOrFail({
                    where: { id: normalizedPrimary.id },
                    relations: { account: true, targetAccount: true, nature: true, poste: true }
                });
            }

            this.validateTransferAmounts(line);

            // Un virement est represente par 2 account_line strictement miroir.
            const savedPrimary = await accountLineService.save(primaryLine) as AccountLine;

            const sibling = savedPrimary.transferGroupId
                ? (await repo.findBy({ transferGroupId: savedPrimary.transferGroupId }))
                    .find((groupLine) => groupLine.id !== savedPrimary.id) ?? null
                : null;

            const mirrorPayload = this.buildMirrorLine(primaryLine, account, targetAccount, savedPrimary.transferGroupId as string);
            const hasTargetChanged = existingLine?.targetAccount?.id !== targetAccount.id;

            // Lors d'une edition standard d'un virement existant, on n'ecrase pas la ligne miroir
            // pour eviter de propager des choix metier (nature/poste/libelle) d'un compte a l'autre.
            const shouldUpsertMirror = !sibling || !existingLine?.transferGroupId || hasTargetChanged;

            if (shouldUpsertMirror) {
                await accountLineService.save({
                    ...mirrorPayload,
                    ...(sibling ? { id: sibling.id } : {})
                });
            }

            return repo.findOneOrFail({
                where: { id: savedPrimary.id },
                relations: { account: true, targetAccount: true, nature: true, poste: true }
            });
        });
    }

    async checkBatch(payload: OperationBatchCheckPayload, accountId: number): Promise<{ updatedCount: number }> {
        const normalizedChecks = payload.checks.map((check) => {
            const normalizedDateValeur = normalizeApiDateInput(check.dateValeur);
            if (!normalizedDateValeur)
                throw badRequest("OPERATION_VALIDATION", `dateValeur invalide : ${check.dateValeur}`);
            return { id: check.id, isChecked: check.isChecked, dateValeur: normalizedDateValeur };
        });

        const updatedLines = await AppDataSource.transaction(async (manager) => {
            const service = new AccountLineService(manager);
            const repo = manager.getRepository(AccountLine);

            const ids = normalizedChecks.map((check) => check.id);
            const existingLines = await repo
                .createQueryBuilder("al")
                .where("al.id IN (:...ids)", { ids })
                .andWhere("al.account_id = :accountId", { accountId })
                .getMany();

            if (existingLines.length !== ids.length)
                throw notFound("OPERATION_NOT_FOUND", "One or more operations were not found.");

            return service.saveAll(normalizedChecks);
        });

        return { updatedCount: updatedLines.length };
    }

    async getAllUncheckedLines(accountId: number): Promise<AccountLine[]> {
        return this.accountLineRepo
            .createQueryBuilder("al")
            .leftJoinAndSelect("al.account", "account")
            .leftJoinAndSelect("al.targetAccount", "targetAccount")
            .leftJoinAndSelect("al.nature", "nature")
            .leftJoinAndSelect("al.poste", "poste")
            .where("al.account_id = :accountId", { accountId })
            .andWhere("al.isChecked = :isChecked", { isChecked: false })
            .orderBy("al.dateOperation", "DESC")
            .addOrderBy("al.id", "DESC")
            .getMany();
    }

    async getAllForExport(accountId: number): Promise<AccountLine[]> {
        return this.accountLineRepo
            .createQueryBuilder("al")
            .leftJoinAndSelect("al.account", "account")
            .leftJoinAndSelect("al.targetAccount", "targetAccount")
            .leftJoinAndSelect("al.nature", "nature")
            .leftJoinAndSelect("al.poste", "poste")
            .where("al.account_id = :accountId", { accountId })
            .orderBy("al.dateOperation", "DESC")
            .addOrderBy("al.id", "DESC")
            .getMany();
    }

    async delete(accountingLineId: number, accountId: number): Promise<DeleteResult> {
        const account = await this.resolveAccountById(accountId, "Operation.save/account", this.accountLineRepo.manager);

        return this.accountLineRepo.delete({
            id: accountingLineId,
            account: { id: account.id }
        })
    }
}