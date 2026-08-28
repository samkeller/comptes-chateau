import { Request, Response } from "express";
import StockService from "../services/StockService";
import { UpdateStockLocationDto } from "../dto/CreateStockLocationDto";

export default class StockLocationController {
    private readonly stockService = new StockService();

    listLocations = async (_req: Request, res: Response) => {
        res.json(await this.stockService.listLocations());
    };

    createLocation = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.createLocation(req.body));
    };

    updateLocation = async (req: Request, res: Response) => {
        res.json(await this.stockService.updateLocation(Number(req.params.id), req.body as UpdateStockLocationDto));
    };

    deleteLocation = async (req: Request, res: Response) => {
        await this.stockService.deleteLocation(Number(req.params.id));
        res.status(204).send();
    };
}
