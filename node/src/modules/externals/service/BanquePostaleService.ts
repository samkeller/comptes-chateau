import type {
    BanquePostaleAmbiguousResultPayload,
    BanquePostaleImportPayload,
    BanquePostaleImportResultPayload,
    BanquePostaleMatchedResultPayload,
    BanquePostaleOperationImportDto,
    OperationBatchCheckOutput
} from "@chocosous/shared";
import { EntityManager, IsNull, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import { AccountLine } from "../../accounts/entities/AccountLine";
import AccountLineService from "../../accounts/services/AccountLineService";
import UserXpService from "../../core/services/UserXpService";
import { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";
import { toBanquePostaleOperationDto } from "../mappers/BanquePostaleOperationImportMapper";
import { badRequest, internalServerError, notFound } from "../../../utils/AppError";

export default class BanquePostaleService {
    private banquePostaleImportRepository: Repository<BanquePostaleOperationImport>;
    private accountLineService: AccountLineService;
    private userXpService: UserXpService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.banquePostaleImportRepository = em.getRepository(BanquePostaleOperationImport);
        this.accountLineService = new AccountLineService(em);
        this.userXpService = new UserXpService(em);
    }

    async import(data: BanquePostaleImportPayload): Promise<BanquePostaleImportResultPayload> {
        return await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new BanquePostaleService(entityManager);
            const { accountId, accountNumber, type, balance, exportDate } = data;
            const newBanquePostaleOperations: Omit<BanquePostaleOperationImport, "id" | "createdAt" | "account">[] = [];
            const otherImportedOperations: BanquePostaleOperationImportDto[] = [];
            const availableExistingOperations: BanquePostaleOperationImportDto[] = [];
            const occurrenceByIdentity = new Map<string, number>();

            for (const operation of data.operations) {
                // Deux opérations bancaires peuvent légitimement avoir les mêmes date,
                // libellé et montant. Leur rang parmi les occurrences identiques permet
                // de les distinguer tout en retrouvant les mêmes lignes au réimport.
                const transactionIdentity = transactionService.buildTransactionIdentity(
                    accountId,
                    operation.dateOperation,
                    operation.label,
                    operation.amount
                );
                const occurrence = (occurrenceByIdentity.get(transactionIdentity) ?? 0) + 1;
                occurrenceByIdentity.set(transactionIdentity, occurrence);
                const compositeExternalId = transactionService.buildCompositeExternalId(
                    transactionIdentity,
                    occurrence
                );
                const existingOperation = await transactionService.findByCompositeExternalId(compositeExternalId);
                if (!existingOperation) {
                    newBanquePostaleOperations.push({
                        accountId,
                        compositeExternalId,
                        dateOperation: operation.dateOperation,
                        label: operation.label,
                        amount: operation.amount,
                        rowNumber: operation.rowNumber,
                        metadata: {
                            accountNumber,
                            type,
                            balance,
                            exportDate,
                        }
                    });
                } else {
                    const existingOperationDto = toBanquePostaleOperationDto(existingOperation);
                    otherImportedOperations.push(existingOperationDto);
                    // Une ligne déjà rapprochée compte comme réimportée, mais elle ne doit
                    // jamais être reproposée comme candidate à une autre opération.
                    if (existingOperation.accountLineId == null) {
                        availableExistingOperations.push(existingOperationDto);
                    }
                }
            }

            const newlyCreatedOperationsDto: BanquePostaleOperationImportDto[] = await transactionService.banquePostaleImportRepository
                .save(newBanquePostaleOperations)
                .then((values) => values.map((op) => toBanquePostaleOperationDto(op)));

            const mergedOperations: BanquePostaleOperationImportDto[] = [
                ...newlyCreatedOperationsDto,
                ...availableExistingOperations
            ];

            const { matchedCandidates, ambiguousCandidates } = await transactionService.matchCandidates(
                accountId,
                mergedOperations
            );

            return {
                linesProcessed: data.operations.length,
                linesCreated: newlyCreatedOperationsDto.length,
                linesSkipped: otherImportedOperations.length,
                matched: matchedCandidates,
                ambiguous: ambiguousCandidates,
            };
        });
    }

    /**
     * Affecte les lignes d'import aux opérations de compte avec une cardinalité 1-1.
     *
     * Une affectation certaine consomme son candidat. Les ensembles restants sont
     * recalculés jusqu'à stabilisation: retirer un candidat peut ainsi transformer
     * une ambiguïté en correspondance certaine. Seuls les ensembles encore multiples
     * sont ensuite renvoyés au formulaire pour un choix manuel.
     */
    private async matchCandidates(accountId: number, mergedOperations: BanquePostaleOperationImportDto[]): Promise<{
        matchedCandidates: BanquePostaleMatchedResultPayload[];
        ambiguousCandidates: BanquePostaleAmbiguousResultPayload[];
    }> {
        const uncheckedLines = await this.accountLineService.getAllUncheckedLines(accountId);
        const ambiguousCandidates: BanquePostaleAmbiguousResultPayload[] = [];
        const matchedCandidates: BanquePostaleMatchedResultPayload[] = [];
        const availableCandidateIds = new Set(mergedOperations.map((candidate) => candidate.id));
        const candidatesByLine = uncheckedLines.map((line) => {
            const checkMinDate = new Date(line.dateOperation);
            checkMinDate.setDate(checkMinDate.getDate() - 2);

            const checkMaxDate = new Date(line.dateOperation);
            checkMaxDate.setDate(checkMaxDate.getDate() + 2);

            const candidates = mergedOperations.filter((candidate) => {
                const parsedCandidateDate = new Date(candidate.dateOperation);

                return candidate.accountId === accountId
                    && parsedCandidateDate >= checkMinDate
                    && parsedCandidateDate <= checkMaxDate
                    && candidate.amount === line.credit - line.debit;
            });

            return { line, candidates };
        });
        const unresolvedLineIds = new Set(uncheckedLines.map((line) => line.id));

        // Propage les affectations certaines jusqu'à ce qu'aucune nouvelle ligne
        // ne puisse réserver à elle seule un candidat encore disponible.
        let assignmentCreated: boolean;
        do {
            assignmentCreated = false;
            for (const { line, candidates } of candidatesByLine) {
                if (!unresolvedLineIds.has(line.id)) {
                    continue;
                }

                const availableCandidates = candidates.filter((candidate) => availableCandidateIds.has(candidate.id));
                if (availableCandidates.length === 1) {
                    availableCandidateIds.delete(availableCandidates[0].id);
                    unresolvedLineIds.delete(line.id);
                    matchedCandidates.push({
                        type: "matched",
                        accountLineId: line.id,
                        candidate: availableCandidates[0]
                    });
                    assignmentCreated = true;
                }
            }
        } while (assignmentCreated);

        for (const { line, candidates } of candidatesByLine) {
            if (!unresolvedLineIds.has(line.id)) {
                continue;
            }

            const availableCandidates = candidates.filter((candidate) => availableCandidateIds.has(candidate.id));
            if (availableCandidates.length > 0) {
                ambiguousCandidates.push({
                    type: "ambiguous",
                    accountLineId: line.id,
                    candidates: availableCandidates
                });
            }
        }

        return { matchedCandidates, ambiguousCandidates };
    }

    private async tryLinkValidatedAccountLine(line: AccountLine): Promise<BanquePostaleOperationImport | undefined> {
        if (!line.isChecked || !line.dateValeur) {
            return;
        }

        const alreadyLinked = await this.banquePostaleImportRepository.findOne({
            where: { accountLineId: line.id }
        });
        if (alreadyLinked) {
            return;
        }

        const normalizedDateValeur = normalizeApiDateInput(line.dateValeur);
        if (!normalizedDateValeur) {
            return;
        }

        const normalizedDateValeurString = `${normalizedDateValeur.getFullYear()}-${String(normalizedDateValeur.getMonth() + 1).padStart(2, "0")}-${String(normalizedDateValeur.getDate()).padStart(2, "0")}`;
        const lineAccountId = line.accountId ?? line.account?.id;
        if (!lineAccountId) {
            return;
        }

        const candidates = await this.banquePostaleImportRepository.find({
            where: {
                accountId: lineAccountId,
                amount: Number(line.credit) - Number(line.debit),
                dateOperation: normalizedDateValeurString,
                accountLineId: IsNull()
            }
        });

        if (candidates.length !== 1) {
            return;
        }

        return await this.banquePostaleImportRepository.save({
            ...candidates[0],
            accountLineId: line.id
        });
    }

    async tryAndValidateAccountLines(userId: number, line: AccountLine[]): Promise<void> {
        const created: BanquePostaleOperationImport[] = [];
        for (const singleLine of line) {
            const createdLine = await this.tryLinkValidatedAccountLine(singleLine);
            if (createdLine) {
                created.push(createdLine);
            }
        }
        if (created.length > 0) {
            await this.userXpService.addXPForUser(userId, "BANQUE_POSTALE_OPERATION_LINKED", created.length);
            await this.banquePostaleImportRepository.save(created);
        }
    }

    /**
        * Persiste les choix explicites effectués dans le formulaire de rapprochement.
        * Chaque identifiant doit appartenir au compte, être encore disponible et ne
        * peut apparaître qu'une fois dans le lot.
     */
    async linkAccountLines(lines: OperationBatchCheckOutput, accountId: number): Promise<BanquePostaleOperationImport[]> {
        const externalIds = lines.map((line) => line.banquePostaleExternalId);
        if (new Set(externalIds).size !== externalIds.length) {
            throw badRequest("BANQUE_POSTALE_OPERATION_ALREADY_SELECTED", "A Banque Postale operation cannot be linked to multiple account lines.");
        }

        const toSave: BanquePostaleOperationImport[] = [];
        for (const line of lines) {

            if (!line.banquePostaleExternalId)
                throw internalServerError("BANQUE_POSTALE_EXTERNAL_ID_MISSING", "Banque Postale external ID is missing.");

            const dbLine = await this.banquePostaleImportRepository.findOneBy({
                compositeExternalId: line.banquePostaleExternalId,
                accountLineId: IsNull(),
                accountId
            })

            if (!dbLine) throw notFound("BANQUE_POSTALE_OPERATION_NOT_FOUND", "Banque Postale operation not found.");

            dbLine.accountLineId = line.id;
            toSave.push(dbLine);

        }
        return await this.banquePostaleImportRepository.save(toSave);
    }

    private findByCompositeExternalId(extId: string): Promise<BanquePostaleOperationImport | null> {
        return this.banquePostaleImportRepository.findOne({
            where: {
                compositeExternalId: extId
            }
        });
    }

    /** Construit l'identité métier commune aux occurrences d'une même transaction. */
    private buildTransactionIdentity(accountId: number, dateOperation: string, label: string, montant: number): string {
        const normalizedLabel = label
            .trim()
            .replace(/\s+/g, "_");

        return `${accountId}|${dateOperation}|${normalizedLabel}|${montant}`.toLocaleUpperCase("fr-FR");
    }

    /** Ajoute le rang stable dans le CSV pour distinguer les transactions identiques. */
    private buildCompositeExternalId(transactionIdentity: string, occurrence: number): string {
        return `${transactionIdentity}|${occurrence}`;
    }
}
