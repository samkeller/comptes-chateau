import { Request, Response } from "express";
import StockUnitService from "../services/StockUnitService";
import requireUserId from "../../accounts/utils/requireUserId";

export default class StockUnitController {
    private readonly stockUnitService = new StockUnitService();

    delete = async (req: Request, res: Response) => {
        await this.stockUnitService.delete(Number(req.params.id));
        res.status(204).send();
    };

    takeUnit = async (req: Request, res: Response) => {
        await this.stockUnitService.takeUnit(Number(req.params.id), requireUserId(req));
        res.status(204).send();
    };
}
