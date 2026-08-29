import { Request, Response } from "express";
import StockItemService from "../services/StockItemService";
import { StockItemCreateDto } from "../dto/StockItemCreateDto";

export default class StockItemController {
    private readonly stockItemService = new StockItemService();

    getAll = async (req: Request, res: Response) => {
        res.json(await this.stockItemService.getAll(req.query));
    };

    create = async (req: Request, res: Response) => {
        const body = req.body as StockItemCreateDto;
        res.json(await this.stockItemService.create(body));
    };

}
