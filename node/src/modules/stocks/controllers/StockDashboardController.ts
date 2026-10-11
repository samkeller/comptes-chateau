import { Request, Response } from "express";
import type { StockMovementsQueryDto } from "@chocosous/shared";
import StockUnitService from "../services/StockUnitService";
import StockMovementService from "../services/StockMovementService";

export default class StockDashboardController {
    private readonly stockUnitService = new StockUnitService();
    private readonly stockMovementService = new StockMovementService();

    getOverview = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json(await this.stockUnitService.getOverview());
    };

    getLastMovements = async (req: Request, res: Response): Promise<void> => {
        const { limit } = req.query as unknown as StockMovementsQueryDto;
        res.status(200).json(await this.stockMovementService.getLastMovements(limit));
    };
}
