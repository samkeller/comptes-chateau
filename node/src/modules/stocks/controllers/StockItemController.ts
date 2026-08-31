import { Request, Response } from "express";
import StockItemService from "../services/StockItemService";
import { StockItemCreateDto } from "../dto/StockItemCreateDto";
import requireUserId from "../../accounts/utils/requireUserId";

export default class StockItemController {
    private readonly stockItemService = new StockItemService();

    getAll = async (req: Request, res: Response) => {
        res.status(200).json(
            await this.stockItemService.getAll(req.query)
        );
    };

    create = async (req: Request, res: Response) => {
        const body = req.body as StockItemCreateDto;
        const connectedUserId = requireUserId(req);

        res.status(201).json(
            await this.stockItemService.create(body, connectedUserId)
        );
    };
}
