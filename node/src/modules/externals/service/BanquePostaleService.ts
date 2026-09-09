
import type { BanquePostaleAmbiguousResultPayload, BanquePostaleImportPayload, BanquePostaleImportResultPayload, BanquePostaleMatchedResultPayload, BanquePostaleOperationImportDto } from "@chocosous/shared";
import { EntityManager, getRepository, Repository } from "typeorm";
import { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";
import { AppDataSource } from "../../../db/dataSource";
import OperationService from "../../accounts/services/OperationService";
import { toBanquePostaleOperationDto } from "../mappers/BanquePostaleOperationImportMapper";

export default class BanquePostaleService {
    private banquePostaleImportRepository: Repository<BanquePostaleOperationImport>;
    private operationService: OperationService

    constructor(em: EntityManager = AppDataSource.manager) {
        this.banquePostaleImportRepository = em.getRepository(BanquePostaleOperationImport);
        this.operationService = new OperationService(em);
    }

    /**
     * Service d'import de données banque postale
     * Objectif: Stocker les résultats en base et fournir une réponse permettant au front-end de facilement
     * faire des vérifications.
     * @param data 
     * @returns 
     */
    async import(data: BanquePostaleImportPayload): Promise<BanquePostaleImportResultPayload> {

        return await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new BanquePostaleService(entityManager);

            const { accountId, accountNumber, type, balance, exportDate } = data;

            const newBanquePostaleOperations: Omit<BanquePostaleOperationImport, "id" | "createdAt" | "account">[] = [];
            const otherImportedOperations: BanquePostaleOperationImportDto[] = [];

            /**
             * Parcours toutes les opérations
             */
            for (const operation of data.operations) {
                const compositeExternalId = transactionService.buildCompositeExternalId(
                    accountId,
                    operation.dateOperation,
                    operation.label,
                    operation.amount
                );
                const existingOperation = await transactionService.findByCompositeExternalId(compositeExternalId);

                // Si elle n'existe pas: l'ajoute
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
                .then(v => v.map(op => toBanquePostaleOperationDto(op)));

            const mergedOperations: BanquePostaleOperationImportDto[] = [
                ...newlyCreatedOperationsDto,
                ...otherImportedOperations
            ]

            // Matching aux opérations non-checkées
            const { matchedCandidates, ambiguousCandidates } = await this.matchCandidates(transactionService, accountId, mergedOperations);

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
     * Calcules les matchs entre des importDto & les lignes unchecked en base. 
     * @param that 
     * @param accountId 
     * @param mergedOperations 
     * @returns 
     */
    private async matchCandidates(that: BanquePostaleService, accountId: number, mergedOperations: BanquePostaleOperationImportDto[]): Promise<{ matchedCandidates: BanquePostaleMatchedResultPayload[]; ambiguousCandidates: BanquePostaleAmbiguousResultPayload[]; }> {
        const uncheckedLines = await that.operationService.getAllUncheckedLines(accountId);
        const ambiguousCandidates: BanquePostaleAmbiguousResultPayload[] = [];
        const matchedCandidates: BanquePostaleMatchedResultPayload[] = [];

        for (const line of uncheckedLines) {

            /**
             * Date minimale pour le matching : date de l'opération - deux jours
             */
            const checkMinDate = new Date(line.dateOperation);
            checkMinDate.setDate(checkMinDate.getDate() - 2);
            /**
             * Date maximale pour le matching : date de l'opération + deux jours
             */
            const checkMaxDate = new Date(line.dateOperation);
            checkMaxDate.setDate(checkMaxDate.getDate() + 2);

            /**
             * Un match =
             *      - Même montant
             *      - Dans la même date à deux jours prêts
             *      - Même compte
             *      - /!\ On ne peut pour l'instant pas se baser sur le label.
             */
            const matchingCandidates = mergedOperations.filter(candidate => {
                const parsedCandidateDate = new Date(candidate.dateOperation);

                return candidate.accountId === accountId &&
                    parsedCandidateDate >= checkMinDate &&
                    parsedCandidateDate <= checkMaxDate &&
                    // Obligé d'inverser le calcul car les imports BanquePostale sont déjà signés (-10/+10)
                    candidate.amount === line.credit - line.debit;
            });

            // Si un seul candidat correspond, on le considère comme un match
            if (matchingCandidates.length === 1) {
                matchedCandidates.push({
                    type: "matched",
                    accountLineId: line.id,
                    candidate: matchingCandidates[0]
                });
            }

            // Si plusieurs candidats correspondent, on les considère comme ambigus
            else if (matchingCandidates.length > 1) {
                ambiguousCandidates.push({
                    type: "ambiguous",
                    accountLineId: line.id,
                    candidates: matchingCandidates
                });
            }
        }
        return { matchedCandidates, ambiguousCandidates };
    }

    /**
     * Recherche une opération par son identifiant externe composite.
     * @param extId 
     * @returns 
     */
    private findByCompositeExternalId(extId: string): Promise<BanquePostaleOperationImport | null> {
        return this.banquePostaleImportRepository.findOne({
            where: {
                compositeExternalId: extId
            }
        });
    }

    /**
     * Pour construire l'identifiant externe composite d'une opération.
     * Pour l'instant pas trop de moyen très fiable. On concatène accountId, dateOperation, label et montant.
     */
    private buildCompositeExternalId(accountId: number, dateOperation: string, label: string, montant: number): string {
        const normalizedLabel = label
            .trim()
            .replace(/\s+/g, "_");

        return `${accountId}|${dateOperation}|${normalizedLabel}|${montant}`.toLocaleUpperCase("fr-FR");
    }
}