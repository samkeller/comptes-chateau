import type { EntityManager, Repository } from "typeorm";
import { In } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { notFound } from "../../../utils/AppError";
import StockUnitService from "./StockUnitService";
import type {
    CreateStockLocationDto,
    StockLocationDto,
    UpdateStockLocationDto,
} from "@chocosous/shared";
import { toStockLocationDto } from "../mappers/StockLocationMapper";
import { StockLocation } from "../entities/StockLocation";
import { StockLocationNotEmptyError } from "./errors/StockLocationNotEmptyError";

export default class StockLocationService {
    private readonly stockLocationRepo: Repository<StockLocation>;
    private readonly stockUnitService: StockUnitService;

    constructor(em: EntityManager = AppDataSource.manager) {
        this.stockLocationRepo = em.getRepository(StockLocation);
        this.stockUnitService = new StockUnitService(em);
    }

    async listLocations(): Promise<StockLocationDto[]> {
        const locations = await this.stockLocationRepo.find({
            order: {
                label: "ASC",
            },
        });

        return locations.map(toStockLocationDto);
    }

    /**
     * Charge les lieux demandés, indexés par id.
     * @throws 404 STOCK_LOCATION_NOT_FOUND si l'un d'eux n'existe pas.
     */
    async findByIdsOrThrow(ids: number[]): Promise<Map<number, StockLocation>> {
        const uniqueIds = [...new Set(ids)];
        const locations = uniqueIds.length > 0
            ? await this.stockLocationRepo.findBy({ id: In(uniqueIds) })
            : [];
        if (locations.length !== uniqueIds.length) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }
        return new Map(locations.map((location) => [location.id, location]));
    }

    async createLocation(dto: CreateStockLocationDto): Promise<StockLocationDto> {
        const location = this.stockLocationRepo.create({
            label: dto.label.trim(),
        });

        const saved = await this.stockLocationRepo.save(location);
        return toStockLocationDto({ ...saved, stockUnitCount: saved.stockUnitCount ?? 0 });
    }

    async updateLocation(id: number, dto: UpdateStockLocationDto): Promise<StockLocationDto> {
        const location = await this.stockLocationRepo.findOneBy({ id });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        location.label = dto.label.trim();
        return toStockLocationDto(await this.stockLocationRepo.save(location));
    }

    async deleteLocation(id: number): Promise<void> {
        const location = await this.stockLocationRepo.findOneBy({ id });
        if (!location) {
            throw notFound("STOCK_LOCATION_NOT_FOUND", "Lieu de stockage introuvable");
        }

        // Vérifier qu'aucun StockUnit n'est lié
        const linkedStockUnits = await this.stockUnitService.getStockUnitsByLocationId(id);

        if (linkedStockUnits.length > 0) {
            throw new StockLocationNotEmptyError("Impossible de supprimer un lieu contenant encore des produits liés");
        }

        await this.stockLocationRepo.remove(location);
    }
}
