import { AppDataSource } from "../../../db/dataSource";
import { notFound } from "../../../utils/AppError";
import { CreateStockLocationDto, UpdateStockLocationDto } from "../dto/CreateStockLocationDto";
import { StockLocationDto, toStockLocationDto } from "../dto/StockLocationDto";
import { StockLocation } from "../entities/StockLocation";

export default class StockLocationService {
    private readonly stockLocationRepo = AppDataSource.getRepository(StockLocation);
    
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

        // TODO :
        // 1. Vérifier qu'aucun StockItem n'est lié
        // 2. Vérifier qu'aucun StockUnit n'est lié
        // const availableUnits = await AppDataSource.getRepository(StockUnit).find({
        //     where: {
        //         locationId: id,
        //     },
        // });
        // if (availableUnits.length > 0) {
        //     throw conflict("STOCK_LOCATION_NOT_EMPTY", "Impossible de supprimer un lieu contenant encore des produits disponibles");
        // }

        await this.stockLocationRepo.softDelete({ id });
    }
}
