import type { CreateStockMovementDto, StockMovementDto } from "@chocosous/shared";
import { EntityManager, In, Repository } from "typeorm";
import { toStockMovementDto } from "../mappers/StockMovementMapper";
import { AppDataSource } from "../../../db/dataSource";
import { StockMovement } from "../entities/StockMovement";

/**
 * Journal des mouvements de stock : un mouvement n'est jamais supprimé.
 * Il conserve les libellés au moment du mouvement pour survivre aux renommages et suppressions.
 * Seul l'`IN` d'un exemplaire est mis à jour quand on corrige cet exemplaire (choix assumé : pas de mouvement de correction).
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

    /**
     * Reporte la correction d'exemplaires sur leur mouvement `IN` (quantité, unité, lieu).
     * La date de péremption n'est pas journalisée : rien à faire si seule elle change.
     */
    async updateInMovements(unitIds: number[], fields: Pick<CreateStockMovementDto, "quantity" | "unit" | "locationId" | "locationLabel">): Promise<void> {
        if (unitIds.length === 0) return;
        await this.stockMovementRepo.update({ unitId: In(unitIds), type: "IN" }, {
            quantity: fields.quantity,
            unit: fields.unit,
            locationId: fields.locationId,
            locationLabel: fields.locationLabel,
        });
    }

    async getLastMovements(limit: number = 20): Promise<StockMovementDto[]> {
        const movements = await this.stockMovementRepo.find({
            order: { createdAt: "DESC", id: "DESC" },
            take: limit,
        });

        return movements.map(toStockMovementDto);
    }
}
