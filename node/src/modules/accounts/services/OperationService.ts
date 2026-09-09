import { ParsedQs } from "qs";
import { randomUUID } from "crypto";
import { EntityManager, In, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { Account } from "../entities/Account";
import { AccountLine } from "../entities/AccountLine";
import AccountLineService from "./AccountLineService";
import TableQueryMapper from "./queryMappers/TableQueryMapper";
import operationTableQueryConfig from "./queryMappers/operationTableQueryConfig";
import TableQueryParser from "./queryMappers/parsers/TableQueryParser";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import { OperationBatchCheckPayload, SaveOperationPayload } from "@chocosous/shared";
import { badRequest, notFound } from "../../../utils/AppError";
import { DeleteResult, Like } from "typeorm";
import UserXpService from "../../core/services/UserXpService";
import BanquePostaleService from "../../externals/service/BanquePostaleService";

const lazyTableQueryParserOptions = {
    allowedSortFields: new Set(Object.keys(operationTableQueryConfig.sortHandlers)),
    allowedFilterFields: new Set(Object.keys(operationTableQueryConfig.filterHandlers)),
    defaultTake: 100,
    maxTake: 200
};

/**
 * Service de gestion des opérations (lignes de compte).
 *
 * Un virement entre deux comptes est matérialisé par DEUX lignes `account_line`
 * strictement miroir, reliées par le même `transferGroupId` :
 * - la ligne "source" (compte émetteur, ex: débit)
 * - la ligne "miroir" (compte cible, ex: crédit, montants inversés, sans poste)
 *
 * Invariants garantis par ce service :
 * - toute création d'un virement crée les deux lignes en une seule transaction ;
 * - toute édition propage les champs "structurels" (montants inversés, date d'opération,
 *   statut de vérification/date de valeur) au miroir, sans jamais écraser les choix
 *   métier propres à chaque compte (label, nature, poste) ;
 * - toute suppression / conversion en opération simple supprime la ligne miroir ;
 * - toute duplication d'un virement crée un NOUVEAU `transferGroupId` (jamais de partage) ;
 * - la validation en lot (checkBatch) propage le statut de vérification au miroir.
 */
export default class OperationService {

    private accountLineRepo: Repository<AccountLine>;
    private userXpService: UserXpService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.accountLineRepo = em.getRepository(AccountLine);
        this.userXpService = new UserXpService(em);
    }

    /**
     * Récupère une ligne de compte spécifique pour un compte donné.
     * @param accountId - Identifiant du compte propriétaire de la ligne.
     * @param accountLineId - Identifiant de la ligne de compte.
     * @throws 404 OPERATION_NOT_FOUND si la ligne n'existe pas dans ce compte.
     */
    async getById(accountId: number, accountLineId: number) {
        const accountLine = await this.accountLineRepo.findOne({
            where: { id: accountLineId, account: { id: accountId } },
            relations: { account: true, targetAccount: true, nature: true, poste: true }
        });

        if (!accountLine) {
            throw notFound("OPERATION_NOT_FOUND", "Operation not found.");
        }

        return accountLine;
    }

    /**
     * Vérifie qu'un virement porte un montant strictement positif dans UN SEUL sens.
     *
     * Le miroir est construit par simple inversion débit ↔ crédit : un virement ne
     * peut donc pas être à la fois débiteur ET créditeur, sinon la paire ne serait
     * pas strictement miroir (montants opposés sur les deux comptes).
     *
     * @throws 400 OPERATION_TRANSFER_VALIDATION si débit ET crédit sont nuls,
     *         ou si les deux sont renseignés en même temps.
     */
    private validateTransferAmounts(line: SaveOperationPayload): void {
        const debit = Number(line.debit ?? 0);
        const credit = Number(line.credit ?? 0);

        if (debit > 0 && credit > 0) {
            throw badRequest("OPERATION_TRANSFER_VALIDATION", "Un virement doit etre dans un seul sens (debit OU credit, pas les deux).");
        }

        if (debit <= 0 && credit <= 0) {
            throw badRequest("OPERATION_TRANSFER_VALIDATION", "Un virement doit avoir un montant strictement positif.");
        }
    }

    /**
     * Résout un compte existant ou lève une erreur 404.
     * @param accountId - Identifiant du compte recherché.
     * @param context - Contexte métier utilisé dans le message d'erreur.
     * @param manager - EntityManager de la transaction courante.
     */
    private async resolveAccountById(accountId: number, context: string, manager = AppDataSource.manager): Promise<Account> {
        const account = await manager.getRepository(Account).findOneBy({ id: accountId });
        if (!account) {
            throw notFound("ACCOUNT_NOT_FOUND", `${context}: compte introuvable (${accountId}).`);
        }
        return account;
    }

    /**
     * Construit la charge utile de la ligne miroir d'un virement.
     *
     * Le miroir inverse les montants (débit ↔ crédit), appartient au compte cible,
     * pointe vers le compte source et ne porte jamais de poste (les postes sont
     * propres à chaque compte).
     *
     * @param line - Ligne source du virement.
     * @param account - Compte source.
     * @param targetAccount - Compte cible.
     * @param transferGroupId - Identifiant de groupe partagé par les deux lignes.
     */
    private buildMirrorLine(line: Partial<AccountLine>, account: Account, targetAccount: Account, transferGroupId: string): Partial<AccountLine> {
        return {
            ...line,
            id: undefined,
            account: targetAccount,
            targetAccount: account,
            transferGroupId,
            poste: null, // Pas de lien entre les postes de comptes différents.
            posteId: null,
            debit: Number(line.credit ?? 0),
            credit: Number(line.debit ?? 0)
        };
    }

    /**
     * Recherche la ligne miroir (sibling) d'une ligne de virement.
     * @param transferGroupId - Groupe de transfert partagé.
     * @param lineId - Identifiant de la ligne courante (exclue du résultat).
     * @param manager - EntityManager de la transaction courante.
     */
    private async findSiblingLine(transferGroupId: string, lineId: number, manager: EntityManager): Promise<AccountLine | null> {
        const repo = manager.getRepository(AccountLine);
        const groupLines = await repo.find({
            where: { transferGroupId },
            relations: { account: true, targetAccount: true }
        });
        return groupLines.find((groupLine) => groupLine.id !== lineId) ?? null;
    }

    /**
     * Recherche paginée/triée/filtrée des opérations d'un compte.
     * @param query - Paramètres de requête HTTP (format table lazy).
     * @param accountId - Identifiant du compte.
     */
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

    /**
     * Crée ou met à jour une opération, en gérant le cycle de vie complet du virement :
     *
     * - Création avec `targetAccount` : crée la ligne source + la ligne miroir
     *   (montants inversés) dans la même transaction, liées par un nouveau `transferGroupId`.
     * - Édition d'un virement : propage au miroir les champs structurels (montants inversés,
     *   `dateOperation`, `isChecked`, `dateValeur`) SANS écraser le label, la nature ou le
     *   poste du miroir (choix métier propres à chaque compte). Si le compte cible change,
     *   le miroir est déplacé vers le nouveau compte.
     * - Conversion opération simple → virement : crée le miroir.
     * - Conversion virement → opération simple (`targetAccount: null`) : supprime le miroir.
     *
     * @param line - Charge utile validée (SaveOperationSchema).
     * @param accountId - Compte propriétaire de la ligne éditée.
     * @param userId - Utilisateur à l'origine de l'action (attribution XP).
     * @throws 404 OPERATION_NOT_FOUND / ACCOUNT_NOT_FOUND.
     * @throws 400 OPERATION_TRANSFER_SAME_ACCOUNT si source = cible.
     * @throws 400 OPERATION_TRANSFER_VALIDATION si le montant du virement est nul.
     */
    async save(line: SaveOperationPayload, accountId: number, userId: number): Promise<AccountLine> {
        return AppDataSource.transaction(async (manager) => {
            const repo = manager.getRepository(AccountLine);
            const accountLineService = new AccountLineService(manager);
            const banquePostaleService = new BanquePostaleService(manager);

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

                const savedPrimaryLine = await repo.findOneOrFail({
                    where: { id: normalizedPrimary.id },
                    relations: { account: true, targetAccount: true, nature: true, poste: true }
                });

                await this.applySaveXp(userId, existingLine, savedPrimaryLine);
                await banquePostaleService.tryLinkValidatedAccountLine(savedPrimaryLine);

                return savedPrimaryLine;
            }

            this.validateTransferAmounts(line);

            // Un virement est represente par 2 account_line strictement miroir.
            const savedPrimary = await accountLineService.save(primaryLine) as AccountLine;

            const sibling = savedPrimary.transferGroupId
                ? await this.findSiblingLine(savedPrimary.transferGroupId, savedPrimary.id, manager)
                : null;

            const mirrorPayload = this.buildMirrorLine(primaryLine, account, targetAccount, savedPrimary.transferGroupId as string);
            const hasTargetChanged = existingLine?.targetAccount?.id !== targetAccount.id;

            // Lors d'une edition standard d'un virement existant, on n'ecrase pas le miroir en
            // entier pour ne pas propager les choix metier (label/nature/poste) d'un compte a
            // l'autre. En revanche, les champs "structurels" du virement (montants, dates,
            // statut de verification) doivent TOUJOURS rester synchronises entre les deux lignes.
            if (sibling) {
                if (hasTargetChanged) {
                    // Le compte cible change : on repositionne completement le miroir.
                    await accountLineService.save({ ...mirrorPayload, id: sibling.id });
                } else {
                    await accountLineService.save({
                        id: sibling.id,
                        dateOperation: mirrorPayload.dateOperation,
                        debit: mirrorPayload.debit,
                        credit: mirrorPayload.credit,
                        isChecked: mirrorPayload.isChecked,
                        dateValeur: mirrorPayload.dateValeur
                    });
                }
            } else {
                // Nouveau virement (ou miroir manquant) : on cree la ligne miroir.
                await accountLineService.save(mirrorPayload);
            }

            const savedPrimaryLine = await repo.findOneOrFail({
                where: { id: savedPrimary.id },
                relations: { account: true, targetAccount: true, nature: true, poste: true }
            });

            await this.applySaveXp(userId, existingLine, savedPrimaryLine);
            await banquePostaleService.tryLinkValidatedAccountLine(savedPrimaryLine);

            return savedPrimaryLine;
        });
    }

    /**
     * Attribue les XP liés à la sauvegarde d'une opération :
     * - création → XP de création ;
     * - première validation (dateValeur nouvellement renseignée) → XP de validation.
     */
    private async applySaveXp(userId: number, existingLine: AccountLine | null, savedPrimaryLine: AccountLine): Promise<void> {
        const isCreation = !existingLine;
        if (isCreation) {
            await this.userXpService.addXPForUser(userId, "ACCOUNT_LINE_OPERATION_CREATED");
        } else if (!existingLine.dateValeur && savedPrimaryLine.dateValeur) {
            await this.userXpService.addXPForUser(userId, "ACCOUNT_LINE_OPERATION_VALIDATED");
        }
    }

    /**
     * Valide une liste d'opérations en batch.
     * OperationBatchCheckSchema: liste d'objets avec id, isChecked et dateValeur.
     *
     * Pour chaque ligne appartenant à un virement, le statut de vérification
     * (isChecked + dateValeur) est propagé à la ligne miroir afin que les deux
     * comptes restent cohérents.
     *
     * @param payload - Liste des validations à appliquer.
     * @param accountId - Compte propriétaire des lignes validées.
     * @param creatorId - Utilisateur à l'origine de la validation (attribution XP).
     * @returns Le nombre d'opérations demandées (hors miroirs propagés).
     * @throws 400 OPERATION_VALIDATION si une dateValeur est invalide.
     * @throws 404 OPERATION_NOT_FOUND si une ligne n'appartient pas au compte.
     */
    async checkBatch(payload: OperationBatchCheckPayload, accountId: number, creatorId: number): Promise<{ updatedCount: number }> {
        const normalizedChecks = payload.checks.map((check) => {
            const normalizedDateValeur = normalizeApiDateInput(check.dateValeur);
            if (!normalizedDateValeur)
                throw badRequest("OPERATION_VALIDATION", `dateValeur invalide : ${check.dateValeur}`);
            return { id: check.id, isChecked: check.isChecked, dateValeur: normalizedDateValeur };
        });

        const updatedLines = await AppDataSource.transaction(async (manager) => {
            const service = new AccountLineService(manager);
            const repo = manager.getRepository(AccountLine);
            const banquePostaleService = new BanquePostaleService(manager);

            const ids = normalizedChecks.map((check) => check.id);
            const existingLines = await repo
                .createQueryBuilder("al")
                .where("al.id IN (:...ids)", { ids })
                .andWhere("al.account_id = :accountId", { accountId })
                .getMany();

            if (existingLines.length !== ids.length)
                throw notFound("OPERATION_NOT_FOUND", "One or more operations were not found.");

            const savedLines = await service.saveAll(normalizedChecks);

            // Propage le statut de verification aux lignes miroir des virements.
            const mirrorChecks = normalizedChecks
                .map((check) => ({
                    check,
                    transferGroupId: existingLines.find((line) => line.id === check.id)?.transferGroupId
                }))
                .filter((entry): entry is typeof entry & { transferGroupId: string } => Boolean(entry.transferGroupId));

            if (mirrorChecks.length > 0) {
                const mirrorLines = await repo.find({
                    where: { transferGroupId: In(mirrorChecks.map((entry) => entry.transferGroupId)) }
                });
                const checkedIds = new Set(ids);
                const checkByTransferGroupId = new Map(mirrorChecks.map((entry) => [entry.transferGroupId, entry.check]));

                const mirrorUpdates = mirrorLines
                    .filter((mirror) => !checkedIds.has(mirror.id))
                    .map((mirror) => {
                        const check = checkByTransferGroupId.get(mirror.transferGroupId as string);
                        return {
                            id: mirror.id,
                            isChecked: check?.isChecked,
                            dateValeur: check?.dateValeur
                        };
                    });

                if (mirrorUpdates.length > 0) {
                    await service.saveAll(mirrorUpdates);
                }
            }

            const existingLineById = new Map(existingLines.map((line) => [line.id, line]));
            const checkedLinesToLink = normalizedChecks
                .filter((check) => check.isChecked && check.dateValeur)
                .map((check) => {
                    const existingLine = existingLineById.get(check.id);
                    if (!existingLine) {
                        return null;
                    }
                    return {
                        ...existingLine,
                        isChecked: check.isChecked,
                        dateValeur: check.dateValeur
                    } as AccountLine;
                })
                .filter((line): line is AccountLine => line !== null);

            for (const checkedLine of checkedLinesToLink) {
                await banquePostaleService.tryLinkValidatedAccountLine(checkedLine);
            }

            return savedLines;
        });

        // Ajout xp utilisateur.
        await this.userXpService.addXPForUser(creatorId, "ACCOUNT_LINE_OPERATION_VALIDATED", updatedLines.length);

        return { updatedCount: updatedLines.length };
    }

    /**
     * Retourne toutes les opérations non vérifiées d'un compte (écran de rapprochement).
     * @param accountId - Identifiant du compte.
     */
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

    /**
     * Retourne toutes les opérations d'un compte pour l'export (CSV...).
     * @param accountId - Identifiant du compte.
     */
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

    /**
     * Supprime une opération. Si la ligne appartient à un virement, la ligne miroir
     * du compte lié est supprimée dans la même transaction (pas de miroir orphelin).
     *
     * @param accountingLineId - Identifiant de la ligne à supprimer.
     * @param accountId - Compte propriétaire attendu de la ligne.
     * @throws 404 ACCOUNT_NOT_FOUND si le compte n'existe pas.
     * @throws 404 OPERATION_NOT_FOUND si la ligne n'existe pas dans ce compte.
     */
    async delete(accountingLineId: number, accountId: number): Promise<DeleteResult> {
        return AppDataSource.transaction(async (manager) => {
            const repo = manager.getRepository(AccountLine);
            const account = await this.resolveAccountById(accountId, "Operation.delete/account", manager);

            const line = await repo.findOne({
                where: { id: accountingLineId, account: { id: account.id } }
            });

            if (!line) {
                throw notFound("OPERATION_NOT_FOUND", "Operation not found.");
            }

            const idsToDelete = [line.id];
            if (line.transferGroupId) {
                const sibling = await this.findSiblingLine(line.transferGroupId, line.id, manager);
                if (sibling) {
                    idsToDelete.push(sibling.id);
                }
            }

            return repo.delete(idsToDelete);
        });
    }

    /**
     * Duplique une opération en lui attribuant un label suffixé "(n)".
     *
     * - La copie repart non vérifiée (isChecked = false, dateValeur = null) :
     *   la duplication est une nouvelle opération qui n'a pas encore été rapprochée.
     * - Si la ligne d'origine est un virement, le virement est dupliqué en entier :
     *   une NOUVELLE paire miroir est créée avec un nouveau `transferGroupId`
     *   (jamais de partage de groupe entre virements distincts).
     *
     * @param accountId - Compte propriétaire de la ligne à dupliquer.
     * @param lineId - Identifiant de la ligne à dupliquer.
     * @returns La nouvelle ligne (source) créée.
     * @throws 404 ACCOUNT_NOT_FOUND si le compte n'existe pas.
     * @throws 404 OPERATION_NOT_FOUND si la ligne n'existe pas dans ce compte.
     */
    async duplicateLine(accountId: number, lineId: number) {
        return AppDataSource.transaction(async (manager) => {
            const account = await this.resolveAccountById(accountId, "Operation.duplicate/account", manager);
            const accountLineService = new AccountLineService(manager);

            const existingLine = await manager.getRepository(AccountLine).findOne({
                where: { id: lineId, account: { id: account.id } },
                relations: { account: true, targetAccount: true, nature: true, poste: true }
            });

            if (!existingLine) {
                throw notFound("OPERATION_NOT_FOUND", "Operation not found.");
            }

            // Regex pour détecter un éventuel (numéro) à la fin du label
            const labelRegex = /^(.*?)(?:\s\((\d+)\))?$/;
            const match = existingLine.label.match(labelRegex);
            const baseLabel = match ? match[1] : existingLine.label;

            // Récupérer toutes les lignes qui commencent par ce baseLabel
            const similarLines = await manager.getRepository(AccountLine).find({
                where: {
                    label: Like(`${baseLabel}%`),
                    account: { id: account.id }
                }
            });

            // Trouver le plus grand numéro existant
            let maxIndex = 0;
            const numberRegex = /\((\d+)\)$/;
            for (const line of similarLines) {
                const numMatch = line.label.match(numberRegex);
                if (numMatch) {
                    const num = parseInt(numMatch[1], 10);
                    if (num > maxIndex) maxIndex = num;
                }
            }

            const newIndex = maxIndex + 1;
            const newLabel = `${baseLabel} (${newIndex})`;

            // La duplication cree une nouvelle operation : elle repart non verifiee
            // et ne partage jamais le transferGroupId de la ligne d'origine.
            const newLine: Partial<AccountLine> = {
                label: newLabel,
                dateOperation: existingLine.dateOperation,
                isChecked: false,
                dateValeur: null,
                debit: existingLine.debit,
                credit: existingLine.credit,
                natureId: existingLine.natureId ?? existingLine.nature?.id ?? null,
                posteId: existingLine.posteId ?? existingLine.poste?.id ?? null,
                source: existingLine.source,
                account,
                targetAccount: existingLine.targetAccount ?? null,
                transferGroupId: existingLine.targetAccount ? randomUUID() : null
            };

            const savedLine = await accountLineService.save(newLine) as AccountLine;

            // Duplique la ligne miroir pour que le virement reste complet sur les deux comptes.
            if (existingLine.targetAccount && savedLine.transferGroupId) {
                const mirrorPayload = this.buildMirrorLine(newLine, account, existingLine.targetAccount, savedLine.transferGroupId);
                await accountLineService.save(mirrorPayload);
            }

            return savedLine;
        });
    }
}
