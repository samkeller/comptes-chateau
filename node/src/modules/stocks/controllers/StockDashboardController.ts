import { Request, Response } from "express";
import StockUnitService from "../services/StockUnitService";
import StockMovementService from "../services/StockMovementService";

export default class StockDashboardController {
    private readonly stockUnitService = new StockUnitService();
    private readonly stockMovementService = new StockMovementService();

    getOverview = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json(await this.stockUnitService.getOverview());
    };

    getLastMovements = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json(await this.stockMovementService.getLastMovements());
    };

    getExpiringItems = async (req: Request, res: Response) => {
        res.status(200).json(
            await this.stockUnitService.getExpiringItems()
        );
    };

}