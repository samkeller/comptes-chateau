import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { StockMovementDto, toStockMovementDto } from "../dto/StockMovementDto";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";
import { StockMovementType } from "@chocosous/shared";

interface CreateMovementData {
    unitId: number;
    /**
     * Quantité / unité de mesure du stockItem
    */
    unit: string;
    itemId: number;
    itemLabel: string;
    quantity: number;
    locationId: number;
    locationLabel: string;
    type: StockMovementType;
}

export default class StockMovementService {
    private readonly stockMovementRepo: Repository<StockMovement>;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockMovementRepo = em.getRepository(StockMovement);
    }

    /**
     * Crée un mouvement de stock.
     *
     * Les informations nécessaires à son interprétation sont donc enregistrées directement 
     * dans le mouvement plutôt que déduites ultérieurement depuis les entités courantes.
     *
     * @param data Données du mouvement à enregistrer.
     * @returns Le mouvement créé sous forme de DTO.
     */
    async createMovement(data: CreateMovementData): Promise<StockMovementDto> {
        const movement = this.stockMovementRepo.create({
            itemId: data.itemId,
            itemLabel: data.itemLabel,
            unitId: data.unitId,
            unit: data.unit,
            locationId: data.locationId,
            locationLabel: data.locationLabel,
            type: data.type,
            quantity: data.quantity,
        });

        const savedMovement = await this.stockMovementRepo.save(movement);

        return toStockMovementDto(savedMovement);
    }

    /**
     * On peut modifier exceptionnellement un mouvement de stock après sa création, par exemple pour corriger une erreur de saisie.
     * On retrouve son unicité via unitId & "IN" car on ne peut pas update une donnée supprimée.
     * @param stockUnit 
     * @returns 
     */
    async updateMovement(stockUnit: StockUnit): Promise<StockMovementDto> {

        /**
         * La contrainte d'unicité existe sur unitId & type.
         * Dans un cas de modif, on ne met à jour que "in" pour l'instant.
         */
        const movement = await this.stockMovementRepo.findOne({
            where: {
                unitId: stockUnit.id,
                type: "IN"
            },
        });

        if (!movement) {
            throw new Error("Stock movement not found");
        }

        movement.unit = stockUnit.unit ?? movement.unit;
        movement.quantity = stockUnit.quantity ?? movement.quantity;
        movement.itemId = stockUnit.itemId ?? movement.itemId;
        movement.itemLabel = stockUnit.item?.label ?? movement.itemLabel;
        movement.locationId = stockUnit.locationId ?? movement.locationId;
        movement.locationLabel = stockUnit.location?.label ?? movement.locationLabel;

        const savedMovement = await this.stockMovementRepo.save(movement);

        return toStockMovementDto(savedMovement);
    }
}
