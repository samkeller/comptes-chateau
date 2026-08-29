import { AppDataSource } from "../../../db/dataSource";
import { StockItem } from "../entities/StockItem";
import { StockItemDto, toStockItemDto } from "../dto/StockItemDto";
import { StockItemsQueryDto } from "../dto/StockUnitsQueryDto";
import { StockItemCreateDto } from "../dto/StockItemCreateDto";

export default class StockItemService {
    private readonly stockItemRepo = AppDataSource.getRepository(StockItem);

    async getAll(query: StockItemsQueryDto): Promise<StockItemDto[]> {
        const { locationId } = query

        const units: StockItem[] = await this.stockItemRepo.find({
            where: {
                ...(locationId && { units: { locationId } }),
            },
            // Besoin de charger les ids units (arr).id
            relations: {
                units: true,
            },
            select: {
                units: {
                    id: true,
                    locationId: true,
                }
            }
        });
        return units.map(toStockItemDto);
    }

    create(body: StockItemCreateDto): any {
        throw new Error("Method not implemented.");
    }
}
