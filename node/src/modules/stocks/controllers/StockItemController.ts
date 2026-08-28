import { Request, Response } from "express";
import StockItemService from "../services/StockItemService";

export default class StockItemController {
    private readonly stockItemService = new StockItemService();

    getAll = async (req: Request, res: Response) => {
        res.json(await this.stockItemService.getAll(req.query));
    };

}
