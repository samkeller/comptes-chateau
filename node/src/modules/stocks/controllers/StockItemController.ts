import { Request, Response } from "express";
import type { ParsedQs } from "qs";
import type { StockItemsQueryDto } from "@chocosous/shared";
import StockItemService from "../services/StockItemService";
import StockBarcodeLookupService from "../services/StockBarcodeLookupService";

export default class StockItemController {
    private readonly stockItemService = new StockItemService();
    private readonly stockBarcodeLookupService = new StockBarcodeLookupService(this.stockItemService);

    lookup = async (req: Request<{ barcode: string }>, res: Response) => {
        res.status(200).json(await this.stockBarcodeLookupService.lookup(req.params.barcode));
    };

    search = async (req: Request, res: Response) => {
        const { includeEmpty } = req.query as StockItemsQueryDto;
        res.status(200).json(await this.stockItemService.search(req.query as ParsedQs, includeEmpty ?? false));
    };

    getOne = async (req: Request, res: Response) => {
        res.status(200).json(await this.stockItemService.getWithLots(Number(req.params.id)));
    };
}
