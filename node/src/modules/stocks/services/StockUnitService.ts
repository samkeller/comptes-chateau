import { AppDataSource } from "../../../db/dataSource";
import { notFound } from "../../../utils/AppError";
import { IsNull, LessThanOrEqual, Not, type EntityManager, type Repository } from "typeorm";
import { formatApiDate } from "../../../utils/DateUtils";
import type { StockDashboardOverviewDto, StockUnitCreateDto, StockUnitDto } from "@chocosous/shared";
import { addDays } from "date-fns";
import { toStockUnitDto } from "../mappers/StockUnitMapper";
import { StockUnit } from "../entities/StockUnit";
import UserXpService from "../../core/services/UserXpService";
import StockMovementService from "./StockMovementService";

const DEFAULT_MOVEMENT_SOURCE = "manual";

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
     * Récupère toutes les unités de stock d'un stock item.
     * @param itemId L'identifiant du stock item.
     * @param locationId L'identifiant du stock location.
     */
    async getStockUnitsByItemId(itemId?: number, locationId?: number): Promise<StockUnitDto[]> {
        const result = await this.stockUnitRepo.find({
            where: {
                ...(itemId ? { itemId } : {}),
                ...(locationId ? { locationId } : {}),
            },
            relations: {
                item: true,
                location: true
            },
            order: {
                expirationDate: "ASC",
            }
        });
        return result.map(toStockUnitDto);
    }

    /**
     * Crée une nouvelle stock unit.
     */
    async create(body: StockUnitCreateDto, connectedUserId: number): Promise<StockUnitDto> {
        try {
            return await AppDataSource.transaction(async (entityManager) => {
                const transactionService = new StockUnitService(entityManager);
                const stockUnit = transactionService.stockUnitRepo.create({
                    itemId: body.itemId,
                    locationId: body.locationId,
                    quantity: body.quantity,
                    unit: body.unit,
                    expirationDate: body.expirationDate ?? null,
                });

                const createdStockUnit: StockUnit = await transactionService.stockUnitRepo.save(stockUnit);

                // Ajout XP utilisateur
                await transactionService.userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_CREATED");

                // Charge les dépendances
                const completedCreatedStockUnit = await transactionService.findOneWithRelationsOrThrow(createdStockUnit.id);

                // Création du movement
                await transactionService.stockMovementService.createMovement({
                    itemLabel: completedCreatedStockUnit.item.label,
                    locationLabel: completedCreatedStockUnit.location.label,
                    locationId: completedCreatedStockUnit.locationId,
                    unit: completedCreatedStockUnit.unit,
                    itemId: completedCreatedStockUnit.itemId,
                    unitId: completedCreatedStockUnit.id,
                    type: "IN",
                    quantity: completedCreatedStockUnit.quantity,
                });

                return toStockUnitDto(completedCreatedStockUnit);
            })
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Met à jour une stock unit existante.
     */
    async update(
        unitId: number,
        body: StockUnitCreateDto
    ): Promise<StockUnitDto> {
        const stockUnit = await this.stockUnitRepo.findOne({
            where: {
                id: unitId,
            },
            relations: {
                item: true,
                location: true,
            },
        });

        if (!stockUnit) {
            throw notFound(
                "STOCK_UNIT_NOT_FOUND",
                "Unite de stock introuvable"
            );
        }

        // Update ciblé plutôt que save() : l'entité chargée porte les anciennes
        // relations item/location, dont TypeORM dériverait les FK au save()
        // et écraserait les nouveaux ids.
        await this.stockUnitRepo.update(unitId, {
            itemId: body.itemId,
            locationId: body.locationId,
            quantity: body.quantity,
            unit: body.unit,
            expirationDate: body.expirationDate ?? null,
        });

        const updatedStockUnit = await this.findOneWithRelationsOrThrow(unitId);

        await this.stockMovementService.updateMovement(updatedStockUnit);

        return toStockUnitDto(updatedStockUnit);
    }

    /**
     * Supprime une stock unit.
     */
    async delete(unitId: number): Promise<void> {
        await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new StockUnitService(entityManager);

            const stockUnit = await transactionService.findOneWithRelationsOrThrow(unitId);

            await transactionService.stockMovementService.createMovement({
                itemLabel: stockUnit.item.label,
                locationLabel: stockUnit.location.label,
                locationId: stockUnit.locationId,
                unit: stockUnit.unit,
                itemId: stockUnit.itemId,
                unitId: stockUnit.id,
                type: "DELETE",
                quantity: stockUnit.quantity,
            });

            await transactionService.stockUnitRepo.remove(stockUnit);
        });
    }

    /**
     * Retire une unite complete du stock en journalisant uniquement un mouvement `OUT`.
     * La disponibilite est deduite de l'historique: une unite ayant deja un `OUT` n'apparait plus dans le stock courant.
     */
    async takeUnit(
        unitId: number,
        connectedUserId: number
    ) {
        await AppDataSource.transaction(async (entityManager) => {
            const transactionService = new StockUnitService(entityManager);

            const unit = await transactionService.findOneWithRelationsOrThrow(unitId);

            await transactionService.stockMovementService.createMovement({
                itemLabel: unit.item.label,
                locationLabel: unit.location.label,
                locationId: unit.locationId,
                unit: unit.unit,
                itemId: unit.itemId,
                unitId: unit.id,
                type: "OUT",
                quantity: unit.quantity,
            });

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
     * Compte les lots présents et les produits distincts.
     * Une échéance aujourd'hui n'est pas encore périmée ; l'horizon de 30 jours est inclus.
     */
    async getOverview(): Promise<StockDashboardOverviewDto> {
        const now = new Date();
        const overview = await this.stockUnitRepo.createQueryBuilder("unit")
            .select("COUNT(DISTINCT unit.itemId)", "inStockItemCount")
            .addSelect("COUNT(*)", "stockUnitCount")
            .addSelect("COUNT(unit.expirationDate)", "datedUnitCount")
            .addSelect("COUNT(CASE WHEN unit.expirationDate BETWEEN :today AND :horizon THEN 1 END)", "expiringSoonUnitCount")
            .setParameters({
                today: formatApiDate(now),
                horizon: formatApiDate(addDays(now, 30)),
            })
            .getRawOne<Record<keyof StockDashboardOverviewDto, string | number>>();

        if (!overview) {
            throw new Error("Stock overview query returned no result");
        }

        return {
            inStockItemCount: Number(overview.inStockItemCount),
            stockUnitCount: Number(overview.stockUnitCount),
            datedUnitCount: Number(overview.datedUnitCount),
            expiringSoonUnitCount: Number(overview.expiringSoonUnitCount),
        };
    }

    /**
     * Renvoie les articles expirés et ceux qui expirent bientôt.
     * @param limit 
     * @returns 
     */
    async getExpiringItems(limit: number = 10): Promise<StockUnit[]> {
        const today = formatApiDate(new Date());
        const expiringItems = await this.stockUnitRepo.find({
            where: {
                expirationDate: Not(IsNull()), // Pas besoin des unités sans dates d'expirations
            },
            relations: {
                item: true,
                location: true,
            },
            order: {
                expirationDate: "ASC",
            },
            take: limit,
        });

        return expiringItems;

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