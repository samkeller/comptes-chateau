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
                }
            }

            const newlyCreatedOperationsRaw = await transactionService.banquePostaleImportRepository.save(newBanquePostaleOperations);
            const newlyCreatedOperations: BanquePostaleOperationImportDto[] = newlyCreatedOperationsRaw.map((op) => toBanquePostaleOperationDto(op));

            const uncheckedLines = await transactionService.accountLineService.getAllUncheckedLines(accountId);
            const ambiguousCandidates: BanquePostaleAmbiguousResultPayload[] = [];
            const matchedCandidates: BanquePostaleMatchedResultPayload[] = [];

            for (const line of uncheckedLines) {
                const checkMinDate = new Date(line.dateOperation);
                checkMinDate.setDate(checkMinDate.getDate() - 2);

                const checkMaxDate = new Date(line.dateOperation);
                checkMaxDate.setDate(checkMaxDate.getDate() + 2);

                const matchingCandidates = newlyCreatedOperations.filter((candidate) => {
                    const parsedCandidateDate = new Date(candidate.dateOperation);
                    return candidate.accountId === accountId &&
                        parsedCandidateDate >= checkMinDate &&
                        parsedCandidateDate <= checkMaxDate &&
                        candidate.amount === line.credit - line.debit;
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

            return {
                linesProcessed: data.operations.length,
                linesCreated: newlyCreatedOperations.length,
                linesSkipped: data.operations.length - newlyCreatedOperations.length,
                matched: matchedCandidates,
                ambiguous: ambiguousCandidates,
            };
        });
    }

    /**
     * Essaie de lier une ligne de compte validée avec une opération Banque Postale correspondante.
     * @param line 
     * @returns 
     */
    private async tryLinkValidatedAccountLine(userId: number, line: AccountLine): Promise<BanquePostaleOperationImport | undefined> {
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

    private findByCompositeExternalId(extId: string): Promise<BanquePostaleOperationImport | null> {
        return this.banquePostaleImportRepository.findOne({
            where: {
                compositeExternalId: extId
            }
        });
    }

    /**
     * Loop through the account lines and attempt to link and validate each one.
     * @param accountId The ID of the account to which the lines belong.
     * @param line An array of account lines to be linked and validated.
     */
    async tryAndValidateAccountLines(userId: number, line: AccountLine[]): Promise<void> {
        const created: BanquePostaleOperationImport[] = []
        for (const singleLine of line) {
            const createdLine = await this.tryLinkValidatedAccountLine(userId, singleLine);
            if (createdLine) {
                created.push(createdLine);
            }
        }
        if (created.length > 0) {
            await this.userXpService.addXPForUser(userId, "BANQUE_POSTALE_OPERATION_LINKED", created.length);
            await this.banquePostaleImportRepository.save(created);
        }
    }

    private buildCompositeExternalId(accountId: number, dateOperation: string, label: string, montant: number): string {
        const normalizedLabel = label
            .trim()
            .replace(/\s+/g, "_");

        return `${accountId}|${dateOperation}|${normalizedLabel}|${montant}`.toLocaleUpperCase("fr-FR");
    }
}
