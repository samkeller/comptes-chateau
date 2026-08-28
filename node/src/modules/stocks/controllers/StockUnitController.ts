import { Request, Response } from "express";
import StockUnitService from "../services/StockUnitService";
import { StockItemsQuerySchema } from "../dto/StockUnitsQueryDto";

export default class StockUnitController {
    private readonly stockService = new StockUnitService();

    intake = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.intake(req.body));
    };

    takeUnit = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.takeUnit(Number(req.params.id), req.body));
    };

}
