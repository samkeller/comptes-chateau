import { Request, Response } from "express";
import StockService from "../services/StockService";
import { StockUnitsQuerySchema } from "../dto/StockUnitsQueryDto";

export default class StockController {
    private readonly stockService = new StockService();

    listAvailableUnits = async (req: Request, res: Response) => {
        const result = StockUnitsQuerySchema.parse(req.query);
        res.json(await this.stockService.listAvailableUnits(result.locationId));
    };

    intake = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.intake(req.body));
    };

    takeUnit = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.takeUnit(Number(req.params.id), req.body));
    };

}
