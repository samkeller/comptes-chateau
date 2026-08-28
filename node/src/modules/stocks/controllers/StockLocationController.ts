import { Request, Response } from "express";
import { UpdateStockLocationDto } from "../dto/CreateStockLocationDto";
import StockLocationService from "../services/StockLocationService";

export default class StockLocationController {
    private readonly stockLocationService = new StockLocationService();

    listLocations = async (_req: Request, res: Response) => {
        res.json(await this.stockLocationService.listLocations());
    };

    createLocation = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockLocationService.createLocation(req.body));
    };

    updateLocation = async (req: Request, res: Response) => {
        res.json(await this.stockLocationService.updateLocation(Number(req.params.id), req.body as UpdateStockLocationDto));
    };

    deleteLocation = async (req: Request, res: Response) => {
        await this.stockLocationService.deleteLocation(Number(req.params.id));
        res.status(204).send();
    };
}
