import { Request, Response } from "express";
import StockItemService from "../services/StockItemService";
import StockUnitService from "../services/StockUnitService";

export default class StockDashboardController {
    private readonly stockItemService = new StockItemService();
    private readonly stockUnitService = new StockUnitService();

    getExpiringItems = async (req: Request, res: Response) => {
        res.status(200).json(
            await this.stockUnitService.getExpiringItems()
        );
    };

}