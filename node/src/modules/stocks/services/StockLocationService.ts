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
    private readonly stockLocationRepo = AppDataSource.getRepository(StockLocation);
    private readonly stockUnitService: StockUnitService = new StockUnitService();

    
    async listLocations(): Promise<StockLocationDto[]> {
        const locations = await this.stockLocationRepo.find({
            order: {
                label: "ASC",
            },
        });

        return locations.map(toStockLocationDto);
    }

    async createLocation(dto: CreateStockLocationDto): Promise<StockLocationDto> {
        const location = this.stockLocationRepo.create({
            label: dto.label.trim(),
        });

        return toStockLocationDto(await this.stockLocationRepo.save(location));
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
