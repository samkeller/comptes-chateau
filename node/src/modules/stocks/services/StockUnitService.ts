import { AppDataSource } from "../../../db/dataSource";
import { notFound } from "../../../utils/AppError";
import { In, type EntityManager, type Repository } from "typeorm";
import type { CreateStockMovementDto, StockDashboardOverviewDto } from "@chocosous/shared";
import { StockUnit } from "../entities/StockUnit";
import UserXpService from "../../core/services/UserXpService";
import StockMovementService from "./StockMovementService";
import { getExpiryBounds } from "../mappers/StockLotMapper";

/** Champs modifiables d'un exemplaire. */
export interface StockUnitFields {
    locationId: number;
    quantity: number;
    unit: string;
    expirationDate: string | null;
}

/** Mouvement à journaliser pour un exemplaire (libellés figés au moment du mouvement). */
export function toMovement(
    unit: Pick<StockUnit, "id" | "itemId"> & StockUnitFields,
    labels: { itemLabel: string; locationLabel: string },
    type: CreateStockMovementDto["type"],
): CreateStockMovementDto {
    return {
        itemId: unit.itemId,
        itemLabel: labels.itemLabel,
        unitId: unit.id,
        unit: unit.unit,
        locationId: unit.locationId,
        locationLabel: labels.locationLabel,
        type,
        quantity: unit.quantity,
    };
}

export default class StockUnitService {
    private readonly stockUnitRepo: Repository<StockUnit>;
    private readonly userXpService: UserXpService;
    private readonly stockMovementService: StockMovementService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockUnitRepo = em.getRepository(StockUnit);
        this.userXpService = new UserXpService(em);
        this.stockMovementService = new StockMovementService(em);
    }

    /**
     * Exemplaires en stock des produits donnés, avec leur lieu (une seule requête pour toute la liste).
     */
    async findByItemIds(itemIds: number[], locationId?: number): Promise<StockUnit[]> {
        if (itemIds.length === 0) return [];
        return this.stockUnitRepo.find({
            where: {
                itemId: In(itemIds),
                ...(locationId ? { locationId } : {}),
            },
            relations: { location: true },
            order: { id: "ASC" },
        });
    }

    /**
     * Charge des exemplaires par id.
     * @throws 404 STOCK_UNIT_NOT_FOUND si l'un d'eux n'existe plus (déjà pris par quelqu'un d'autre…).
     */
    async findByIdsOrThrow(ids: number[]): Promise<StockUnit[]> {
        if (ids.length === 0) return [];
        const units = await this.stockUnitRepo.findBy({ id: In(ids) });
        if (units.length !== new Set(ids).size) {
            throw notFound("STOCK_UNIT_NOT_FOUND", "Un exemplaire n'existe plus : rechargez le produit");
        }
        return units;
    }

    async createMany(itemId: number, fields: StockUnitFields, copies: number): Promise<StockUnit[]> {
        if (copies <= 0) return [];
        const units = Array.from({ length: copies }, () => this.stockUnitRepo.create({ itemId, ...fields }));
        return this.stockUnitRepo.save(units);
    }

    async updateMany(ids: number[], fields: StockUnitFields): Promise<void> {
        if (ids.length === 0) return;
        await this.stockUnitRepo.update({ id: In(ids) }, fields);
    }

    async removeMany(units: StockUnit[]): Promise<void> {
        if (units.length === 0) return;
        await this.stockUnitRepo.delete({ id: In(units.map((unit) => unit.id)) });
    }

    /**
     * Retire un exemplaire saisi par erreur : journalise un `DELETE` (pas une consommation) puis le supprime.
     */
    async delete(unitId: number): Promise<void> {
        await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new StockUnitService(entityManager);
            const unit = await transactionService.findOneWithRelationsOrThrow(unitId);

            await transactionService.stockMovementService.createMovements([
                toMovement(unit, { itemLabel: unit.item.label, locationLabel: unit.location.label }, "DELETE"),
            ]);
            await transactionService.stockUnitRepo.remove(unit);
        });
    }

    /**
     * Coche (consomme) un exemplaire : journalise un mouvement `OUT`, crédite l'XP puis supprime l'exemplaire.
     * Le produit reste au catalogue même s'il n'a plus d'exemplaire.
     */
    async takeUnit(unitId: number, connectedUserId: number): Promise<void> {
        await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new StockUnitService(entityManager);
            const unit = await transactionService.findOneWithRelationsOrThrow(unitId);

            await transactionService.stockMovementService.createMovements([
                toMovement(unit, { itemLabel: unit.item.label, locationLabel: unit.location.label }, "OUT"),
            ]);
            await transactionService.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_TAKE");
            await transactionService.stockUnitRepo.remove(unit);
        });
    }

    async getStockUnitsByLocationId(id: number): Promise<StockUnit[]> {
        return this.stockUnitRepo.find({
            where: {
                locationId: id,
            },
        });
    }

    /**
     * Compte les exemplaires présents et les produits distincts.
     * Une échéance aujourd'hui n'est pas encore périmée ; l'horizon de 30 jours est inclus.
     */
    async getOverview(now: Date = new Date()): Promise<StockDashboardOverviewDto> {
        const { today, soonLimit } = getExpiryBounds(now);
        const overview = await this.stockUnitRepo.createQueryBuilder("unit")
            .select("COUNT(DISTINCT unit.itemId)", "inStockItemCount")
            .addSelect("COUNT(*)", "stockUnitCount")
            .addSelect("COUNT(unit.expirationDate)", "datedUnitCount")
            .addSelect("COUNT(CASE WHEN unit.expirationDate < :today THEN 1 END)", "expiredUnitCount")
            .addSelect("COUNT(CASE WHEN unit.expirationDate BETWEEN :today AND :horizon THEN 1 END)", "expiringSoonUnitCount")
            .setParameters({ today, horizon: soonLimit })
            .getRawOne<Record<keyof StockDashboardOverviewDto, string | number>>();

        return {
            inStockItemCount: Number(overview?.inStockItemCount ?? 0),
            stockUnitCount: Number(overview?.stockUnitCount ?? 0),
            datedUnitCount: Number(overview?.datedUnitCount ?? 0),
            expiredUnitCount: Number(overview?.expiredUnitCount ?? 0),
            expiringSoonUnitCount: Number(overview?.expiringSoonUnitCount ?? 0),
        };
    }

    private async findOneWithRelationsOrThrow(unitId: number): Promise<StockUnit> {
        const unit = await this.stockUnitRepo.findOne({
            where: {
                id: unitId,
            },
            relations: {
                item: true,
                location: true,
            },
        });

        if (!unit) {
            throw notFound(
                "STOCK_UNIT_NOT_FOUND",
                "Unite de stock introuvable"
            );
        }

        return unit;
    }
}
