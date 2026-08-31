import { Request, Response } from "express";
import StockUnitService from "../services/StockUnitService";
import { GetAllStockUnitSchemaDto } from "../dto/ItemIdDto";
import { StockUnitCreateDto } from "../dto/StockUnitCreateDto";
import requireUserId from "../../accounts/utils/requireUserId";

export default class StockUnitController {
    private readonly stockUnitService = new StockUnitService();

    getAll = async (req: Request, res: Response) => {
        const { itemId } = req.query as GetAllStockUnitSchemaDto;

        res.status(200).json(
            await this.stockUnitService.getStockUnitsByItemId(itemId)
        );
    };

    create = async (req: Request, res: Response) => {
        const body = req.body as StockUnitCreateDto;
        const connectedUserId = requireUserId(req);

        res.status(201).json(
            await this.stockUnitService.create(body, connectedUserId)
        );
    };

    update = async (req: Request, res: Response) => {
        const stockUnitId = Number(req.params.id);
        const body = req.body as StockUnitCreateDto;

        res.status(200).json(
            await this.stockUnitService.update(stockUnitId, body)
        );
    };

    delete = async (req: Request, res: Response) => {
        const stockUnitId = Number(req.params.id);

        await this.stockUnitService.delete(stockUnitId);

        res.status(204).send();
    };

    takeUnit = async (req: Request, res: Response) => {
        const stockUnitId = Number(req.params.id);
        const connectedUserId = requireUserId(req);

        res.status(201).json(
            await this.stockUnitService.takeUnit(
                stockUnitId,
                req.body,
                connectedUserId
            )
        );
    };
}
