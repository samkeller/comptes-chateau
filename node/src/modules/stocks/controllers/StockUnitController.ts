import { Request, Response } from "express";
import StockUnitService from "../services/StockUnitService";
import { StockItemsQuerySchema } from "../dto/StockUnitsQueryDto";
import { GetAllStockUnitSchemaDto } from "../dto/ItemIdDto";

export default class StockUnitController {

    private readonly stockService = new StockUnitService();

    getAll = async (req: Request, res: Response) => {
        const { itemId }: GetAllStockUnitSchemaDto = req.query;
        res.status(200).json(await this.stockService.getStockUnitsByItemId(itemId));
    };

    takeUnit = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.takeUnit(Number(req.params.id), req.body));
    };

}
