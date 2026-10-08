import type { CreateStockMovementDto, SaveStockEntryDto, StockItemWithLotsDto } from "@chocosous/shared";
import type { EntityManager } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { badRequest } from "../../../utils/AppError";
import UserXpService from "../../core/services/UserXpService";
import type { StockUnit } from "../entities/StockUnit";
import StockItemService from "./StockItemService";
import StockLocationService from "./StockLocationService";
import StockMovementService from "./StockMovementService";
import StockUnitService, { toMovement, type StockUnitFields } from "./StockUnitService";

export interface SaveStockEntryResult {
    item: StockItemWithLotsDto;
    created: boolean;
}

function sameFields(unit: StockUnit, fields: StockUnitFields): boolean {
    return unit.locationId === fields.locationId
        && unit.quantity === fields.quantity
        && unit.unit === fields.unit
        && (unit.expirationDate ?? null) === fields.expirationDate;
}

/**
 * Saisie atomique « produit + lots » : la distinction produit / exemplaire reste invisible pour l'utilisateur.
 */
export default class StockEntryService {
    constructor(private readonly em: EntityManager = AppDataSource.manager) {}

    /**
     * Crée ou met à jour un produit et ses lots dans une seule transaction.
     * - produit sans `id` : créé (XP `STOCK_ITEM_CREATED`) ;
     * - lot existant : ses exemplaires sont corrigés (leur `IN` est mis à jour), complétés (`IN`) ou retirés (`DELETE`, les plus récents d'abord) ;
     * - nouveau lot : `copies` exemplaires créés (`IN`) ;
     * - les exemplaires non cités sont laissés intacts (pas de suppression implicite).
     * Un seul crédit d'XP par saisie, proportionnel au nombre d'exemplaires ajoutés.
     */
    async save(dto: SaveStockEntryDto, connectedUserId: number): Promise<SaveStockEntryResult> {
        return this.em.transaction(async (manager) => {
            const itemService = new StockItemService(manager);
            const unitService = new StockUnitService(manager);
            const locationService = new StockLocationService(manager);
            const movementService = new StockMovementService(manager);
            const userXpService = new UserXpService(manager);

            // Toutes les vérifications avant la première écriture.
            const locations = await locationService.findByIdsOrThrow(dto.lots.map((lot) => lot.locationId));
            const existingUnits = await unitService.findByIdsOrThrow(dto.lots.flatMap((lot) => lot.unitIds));
            if (existingUnits.some((unit) => unit.itemId !== dto.item.id)) {
                throw badRequest("STOCK_UNIT_ITEM_MISMATCH", "Un exemplaire n'appartient pas à ce produit");
            }
            const unitsById = new Map(existingUnits.map((unit) => [unit.id, unit]));
            // Libellés des lieux d'origine pour journaliser les retraits.
            const originLocations = await locationService.findByIdsOrThrow(existingUnits.map((unit) => unit.locationId));

            const { item, created } = await itemService.save(dto.item);

            const movements: CreateStockMovementDto[] = [];
            let addedCopies = 0;

            for (const lot of dto.lots) {
                const fields: StockUnitFields = {
                    locationId: lot.locationId,
                    quantity: lot.quantity,
                    unit: lot.unit,
                    expirationDate: lot.expirationDate,
                };
                const labels = { itemLabel: item.label, locationLabel: locations.get(lot.locationId)!.label };
                const lotUnits = lot.unitIds.map((id) => unitsById.get(id)!);
                const kept = lotUnits.slice(0, lot.copies);
                const removed = lotUnits.slice(lot.copies);

                const adjustedIds = kept.filter((unit) => !sameFields(unit, fields)).map((unit) => unit.id);
                await unitService.updateMany(adjustedIds, fields);
                await movementService.updateInMovements(adjustedIds, { ...fields, locationLabel: labels.locationLabel });

                await unitService.removeMany(removed);
                movements.push(...removed.map((unit) => toMovement(
                    { ...unit, expirationDate: unit.expirationDate ?? null },
                    { itemLabel: item.label, locationLabel: originLocations.get(unit.locationId)!.label },
                    "DELETE",
                )));

                const createdUnits = await unitService.createMany(item.id, fields, lot.copies - kept.length);
                movements.push(...createdUnits.map((unit) => toMovement(unit, labels, "IN")));
                addedCopies += createdUnits.length;
            }

            await movementService.createMovements(movements);

            if (created) await userXpService.addXPForUser(connectedUserId, "STOCK_ITEM_CREATED");
            if (addedCopies > 0) await userXpService.addXPForUser(connectedUserId, "STOCK_UNIT_CREATED", addedCopies);

            return { item: await itemService.getWithLots(item.id), created };
        });
    }
}
