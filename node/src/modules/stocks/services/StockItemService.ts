import { AppDataSource } from "../../../db/dataSource";
import type { EntityManager } from "typeorm";
import type { Repository } from "typeorm";
import { StockItem } from "../entities/StockItem";
import type { CreateStockItemDto, StockItemDto, StockItemsQueryDto } from "@chocosous/shared";
import { toStockItemDto } from "../mappers/StockItemMapper";
import UserXpService from "../../core/services/UserXpService";

export default class StockItemService {
    private readonly stockItemRepo: Repository<StockItem>;
    private readonly userXpService: UserXpService;

    constructor(em: EntityManager) {
        this.stockItemRepo = em.getRepository(StockItem);
        this.userXpService = new UserXpService(em);
    }

    async getAll(query: StockItemsQueryDto): Promise<StockItemDto[]> {
        const { locationId } = query

        const items = await this.stockItemRepo.find({
            where: {
                ...(locationId && {
                    units: {
                        locationId,
                    },
                }),
            },
            relations: {
                units: true,
            },
            select: {
                units: {
                    id: true,
                    locationId: true,
                },
            },
        });

        return items.map(toStockItemDto);
    }

    async create(body: CreateStockItemDto, connectedUserId: number): Promise<StockItemDto> {

        const stockItem = this.stockItemRepo.create({
            label: body.label,
            barcode: body.barcode ?? null,
            defaultUnit: body.defaultUnit,
            imageUrl: body.imageUrl ?? null,
        });

        const savedStockItem = await this.stockItemRepo.save(stockItem);

        // Ajout userXP
        await this.userXpService.addXPForUser(connectedUserId, "STOCK_ITEM_CREATED");

        return toStockItemDto(savedStockItem);
    }
}
