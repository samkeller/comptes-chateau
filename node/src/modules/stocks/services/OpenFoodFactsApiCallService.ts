import type { EntityManager, Repository } from "typeorm";
import { MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { OpenFoodFactsApiCall, type OpenFoodFactsCallTrigger } from "../entities/OpenFoodFactsApiCall";
import type { OpenFoodFactsFetchResult } from "../clients/OpenFoodFactsClient";

export default class OpenFoodFactsApiCallService {
    private readonly callRepo: Repository<OpenFoodFactsApiCall>;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.callRepo = em.getRepository(OpenFoodFactsApiCall);
    }

    /** Journalise un appel réellement émis vers OFF. */
    async log(barcode: string, trigger: OpenFoodFactsCallTrigger, result: OpenFoodFactsFetchResult): Promise<void> {
        await this.callRepo.insert({
            barcode,
            trigger,
            outcome: result.outcome,
            httpStatus: result.httpStatus,
            durationMs: result.durationMs,
        });
    }

    /** Nombre d'appels émis depuis une date (suivi de consommation). */
    async countSince(since: Date): Promise<number> {
        return this.callRepo.count({ where: { createdAt: MoreThanOrEqual(since) } });
    }
}
