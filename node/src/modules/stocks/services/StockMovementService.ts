import type { CreateStockMovementDto, StockMovementDto } from "@chocosous/shared";
import { EntityManager, Repository } from "typeorm";
import { toStockMovementDto } from "../mappers/StockMovementMapper";
import { AppDataSource } from "../../../db/dataSource";
import { StockMovement } from "../entities/StockMovement";

/**
 * Journal append-only des mouvements de stock : un mouvement n'est jamais modifié ni supprimé.
 * Il conserve les libellés au moment du mouvement pour survivre aux renommages et suppressions.
 */
export default class StockMovementService {
    private readonly stockMovementRepo: Repository<StockMovement>;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockMovementRepo = em.getRepository(StockMovement);
    }

    /**
     * Enregistre des mouvements de stock (insertion groupée).
     * @param movements Données des mouvements à enregistrer.
     */
    async createMovements(movements: CreateStockMovementDto[]): Promise<void> {
        if (movements.length === 0) return;
        await this.stockMovementRepo.insert(movements.map((data) => ({
            itemId: data.itemId,
            itemLabel: data.itemLabel,
            unitId: data.unitId,
            unit: data.unit,
            locationId: data.locationId,
            locationLabel: data.locationLabel,
            type: data.type,
            quantity: data.quantity,
        })));
    }

    async getLastMovements(limit: number = 20): Promise<StockMovementDto[]> {
        const movements = await this.stockMovementRepo.find({
            order: { createdAt: "DESC", id: "DESC" },
            take: limit,
        });

        return movements.map(toStockMovementDto);
    }
}
