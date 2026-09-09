import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { Account } from "../entities/Account";
import { AccountLine } from "../entities/AccountLine";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import { badRequest } from "../../../utils/AppError";

/**
 * Service de persistance des lignes de compte (`account_line`).
 *
 * Point d'entrée unique pour les écritures unitaires ou en lot : il centralise
 * la normalisation des dates et les invariants métier/DB :
 * - une ligne vérifiée (`isChecked = true`) doit avoir une `dateValeur` ;
 * - une ligne non vérifiée ne doit pas avoir de `dateValeur` ;
 * - `transferGroupId` et `targetAccount` sont soit tous deux renseignés
 *   (opération liée / virement inter-comptes), soit tous deux nuls (opération
 *   simple) — jamais un seul des deux.
 *
 * La logique de virement (lignes miroir entre comptes) est orchestrée par
 * {@link OperationService}, qui délègue ici la persistance de chaque ligne.
 */
export default class AccountLineService {

    private accountLineRepo;

    constructor(manager?: EntityManager) {
        this.accountLineRepo = manager ?
            manager.getRepository(AccountLine) :
            AppDataSource.getRepository(AccountLine);

    }

    /**
     * Charge en une requête les lignes existantes correspondant aux identifiants fournis.
     * @returns Une map id -> ligne persistée (les lignes absentes sont simplement omises).
     */
    private async resolveExistingLinesById(accountLines: Partial<AccountLine>[]): Promise<Map<number, AccountLine>> {
        const ids = accountLines
            .map((line) => line.id)
            .filter((id): id is number => typeof id === "number" && id > 0);

        if (ids.length === 0) {
            return new Map<number, AccountLine>();
        }

        const existingLines = await this.accountLineRepo.findBy({ id: In(ids) });
        return new Map(existingLines.map((line) => [line.id, line]));
    }

    /**
     * Normalise les dates d'une ligne et valide le couple isChecked/dateValeur.
     *
     * Les champs absents de la charge utile sont complétés avec l'état persisté
     * (ligne existante) afin de valider l'état effectif après sauvegarde.
     *
     * @param accountLine - Ligne partielle à sauvegarder.
     * @param existingLine - État persisté de la ligne (si connue), utilisé pour la validation.
     * @param context - Contexte métier utilisé dans les messages d'erreur.
     * @throws 400 OPERATION_VALIDATION si l'état isChecked/dateValeur est incohérent.
     */
    private normalizeAndValidateLine(
        accountLine: Partial<AccountLine>,
        existingLine: AccountLine | undefined,
        context: string
    ): Partial<AccountLine> {
        const hasIsChecked = "isChecked" in accountLine;
        const hasDateValeur = "dateValeur" in accountLine;
        const hasTransferGroupId = "transferGroupId" in accountLine;
        const hasTargetAccount = "targetAccount" in accountLine;

        const normalizedDateOperation = normalizeApiDateInput(accountLine.dateOperation) ?? undefined;
        const normalizedDateValeur = normalizeApiDateInput(accountLine.dateValeur);

        const effectiveIsChecked = hasIsChecked ? Boolean(accountLine.isChecked) : (existingLine?.isChecked ?? false);
        const effectiveDateValeur = hasDateValeur ? normalizedDateValeur : (existingLine?.dateValeur ?? null);

        if (effectiveIsChecked && !effectiveDateValeur) {
            throw badRequest("OPERATION_VALIDATION", `${context}: checked operation must have a dateValeur.`);
        }

        if (!effectiveIsChecked && effectiveDateValeur) {
            throw badRequest("OPERATION_VALIDATION", `${context}: unchecked operation cannot have a dateValeur.`);
        }

        // transferGroupId et targetAccount doivent etre soit tous deux renseignes
        // (operation liee), soit tous deux nuls (operation simple) : jamais un seul.
        // Un champ ABSENT de la charge utile signifie "ne pas modifier" (contrairement
        // a isChecked/dateValeur, il n'est pas resolu depuis l'etat persiste car il ne
        // sert pas a la validation du couple coche/date) : on valide donc chaque champ
        // uniquement lorsqu'il est explicitement fourni.
        const resolveAccountId = (value: Account | number | null | undefined): number | null => {
            if (value === null || value === undefined) return null;
            if (typeof value === "number") return value > 0 ? value : null;
            return typeof value.id === "number" && value.id > 0 ? value.id : null;
        };

        if (hasTransferGroupId && hasTargetAccount) {
            const hasGroup = Boolean(accountLine.transferGroupId);
            const hasTarget = resolveAccountId(accountLine.targetAccount) !== null;
            if (hasGroup !== hasTarget) {
                throw badRequest("OPERATION_VALIDATION", `${context}: transferGroupId and targetAccount must both be set (linked operation) or both be null (simple operation).`);
            }
        } else if (hasTransferGroupId) {
            const currentTargetId = resolveAccountId(existingLine?.targetAccount);
            const becomesLinked = Boolean(accountLine.transferGroupId);
            if (becomesLinked !== (currentTargetId !== null)) {
                throw badRequest("OPERATION_VALIDATION", `${context}: transferGroupId and targetAccount must both be set (linked operation) or both be null (simple operation).`);
            }
        } else if (hasTargetAccount) {
            const newTargetId = resolveAccountId(accountLine.targetAccount);
            const becomesLinked = newTargetId !== null;
            if (becomesLinked !== Boolean(existingLine?.transferGroupId)) {
                throw badRequest("OPERATION_VALIDATION", `${context}: transferGroupId and targetAccount must both be set (linked operation) or both be null (simple operation).`);
            }
        }

        if (!hasIsChecked && !hasDateValeur) {
            return {
                ...accountLine,
                dateOperation: normalizedDateOperation
            };
        }

        return {
            ...accountLine,
            dateOperation: normalizedDateOperation,
            ...(hasIsChecked && { isChecked: effectiveIsChecked }),
            ...(hasDateValeur && { dateValeur: effectiveDateValeur })
        };
    }

    /**
     * Sauvegarde (création ou mise à jour) une ligne de compte après normalisation
     * et validation du couple isChecked/dateValeur.
     * @param accountLine - Ligne partielle à persister (avec `id` pour une mise à jour).
     */
    async save(accountLine: Partial<AccountLine>) {
        // TODO add validation (https://github.com/typestack/class-validator)
        const existingLine = typeof accountLine.id === "number" && accountLine.id > 0 ?
            await this.accountLineRepo.findOneBy({ id: accountLine.id }) :
            undefined;

        const normalizedLine = this.normalizeAndValidateLine(
            accountLine,
            existingLine ?? undefined,
            `AccountLine ${accountLine.id ?? "new"}`
        );

        return this.accountLineRepo.save(normalizedLine);
    }

    /**
     * Sauvegarde en lot une liste de lignes de compte, avec la même normalisation
     * et validation que {@link save}.
     * @param accountLines - Lignes partielles à persister.
     */
    async saveAll(accountLines: Partial<AccountLine>[]) {
        // TODO add validation (https://github.com/typestack/class-validator)
        const existingLinesById = await this.resolveExistingLinesById(accountLines);

        const normalizedLines = accountLines.map((line, index) => this.normalizeAndValidateLine(
            line,
            typeof line.id === "number" && line.id > 0 ? existingLinesById.get(line.id) : undefined,
            `AccountLine batch item ${index}`
        ));

        return this.accountLineRepo.save(normalizedLines);
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
}
