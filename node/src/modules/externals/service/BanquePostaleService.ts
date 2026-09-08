
import type { BanquePostaleImportPayload, BanquePostaleImportResultPayload } from "@chocosous/shared";
import { EntityManager, getRepository, Repository } from "typeorm";
import { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";
import { AppDataSource } from "../../../db/dataSource";

export default class BanquePostaleService {
    private banquePostaleImportRepository: Repository<BanquePostaleOperationImport>;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.banquePostaleImportRepository = em.getRepository(BanquePostaleOperationImport);
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

            const operationsToCreate: Omit<BanquePostaleOperationImport, "id" | "createdAt" | "account">[] = [];

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
                    operationsToCreate.push({
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

            await transactionService.banquePostaleImportRepository.save(operationsToCreate);


            return {
                linesProcessed: data.operations.length,
                linesCreated: operationsToCreate.length,
                linesSkipped: data.operations.length - operationsToCreate.length,
            };
        });
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