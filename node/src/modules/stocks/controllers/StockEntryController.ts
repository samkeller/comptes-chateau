import { Request, Response } from "express";
import type { SaveStockEntryDto } from "@chocosous/shared";
import requireUserId from "../../accounts/utils/requireUserId";
import StockEntryService from "../services/StockEntryService";

export default class StockEntryController {
    private readonly stockEntryService = new StockEntryService();

    save = async (req: Request, res: Response) => {
        const { item, created } = await this.stockEntryService.save(req.body as SaveStockEntryDto, requireUserId(req));
        res.status(created ? 201 : 200).json(item);
    };
}
