import type {
    BanquePostaleAmbiguousResultPayload,
    BanquePostaleImportPayload,
    BanquePostaleImportResultPayload,
    BanquePostaleMatchedResultPayload,
    BanquePostaleOperationImportDto
} from "@chocosous/shared";
import { EntityManager, IsNull, Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import { AccountLine } from "../../accounts/entities/AccountLine";
import AccountLineService from "../../accounts/services/AccountLineService";
import UserXpService from "../../core/services/UserXpService";
import { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";
import { toBanquePostaleOperationDto } from "../mappers/BanquePostaleOperationImportMapper";

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

            for (const operation of data.operations) {
                const compositeExternalId = transactionService.buildCompositeExternalId(
                    accountId,
                    operation.dateOperation,
                    operation.label,
                    operation.amount
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
                    otherImportedOperations.push(toBanquePostaleOperationDto(existingOperation));
                }
            }

            const newlyCreatedOperationsDto: BanquePostaleOperationImportDto[] = await transactionService.banquePostaleImportRepository
                .save(newBanquePostaleOperations)
                .then((values) => values.map((op) => toBanquePostaleOperationDto(op)));

            const mergedOperations: BanquePostaleOperationImportDto[] = [
                ...newlyCreatedOperationsDto,
                ...otherImportedOperations
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

    private async matchCandidates(accountId: number, mergedOperations: BanquePostaleOperationImportDto[]): Promise<{
        matchedCandidates: BanquePostaleMatchedResultPayload[];
        ambiguousCandidates: BanquePostaleAmbiguousResultPayload[];
    }> {
        const uncheckedLines = await this.accountLineService.getAllUncheckedLines(accountId);
        const ambiguousCandidates: BanquePostaleAmbiguousResultPayload[] = [];
        const matchedCandidates: BanquePostaleMatchedResultPayload[] = [];

        for (const line of uncheckedLines) {
            const checkMinDate = new Date(line.dateOperation);
            checkMinDate.setDate(checkMinDate.getDate() - 2);

            const checkMaxDate = new Date(line.dateOperation);
            checkMaxDate.setDate(checkMaxDate.getDate() + 2);

            const matchingCandidates = mergedOperations.filter((candidate) => {
                const parsedCandidateDate = new Date(candidate.dateOperation);

                return candidate.accountId === accountId
                    && parsedCandidateDate >= checkMinDate
                    && parsedCandidateDate <= checkMaxDate
                    && candidate.amount === line.credit - line.debit;
            });

            if (matchingCandidates.length === 1) {
                matchedCandidates.push({
                    type: "matched",
                    accountLineId: line.id,
                    candidate: matchingCandidates[0]
                });
            } else if (matchingCandidates.length > 1) {
                ambiguousCandidates.push({
                    type: "ambiguous",
                    accountLineId: line.id,
                    candidates: matchingCandidates
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

    private findByCompositeExternalId(extId: string): Promise<BanquePostaleOperationImport | null> {
        return this.banquePostaleImportRepository.findOne({
            where: {
                compositeExternalId: extId
            }
        });
    }

    private buildCompositeExternalId(accountId: number, dateOperation: string, label: string, montant: number): string {
        const normalizedLabel = label
            .trim()
            .replace(/\s+/g, "_");

        return `${accountId}|${dateOperation}|${normalizedLabel}|${montant}`.toLocaleUpperCase("fr-FR");
    }
}
