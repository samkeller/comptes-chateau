import { Request, Response } from "express";
import StockService from "../services/StockService";
import { AppError } from "../../../utils/AppError";
import { StockItemsQuerySchema } from "../dto/CreateStockItemDto";

export default class StockController {
    private readonly stockService = new StockService();

    listLocations = async (_req: Request, res: Response) => {
        res.json(await this.stockService.listLocations());
    };

    createLocation = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.createLocation(req.body));
    };

    updateLocation = async (req: Request, res: Response) => {
        res.json(await this.stockService.updateLocation(Number(req.params.id), req.body));
    };

    deleteLocation = async (req: Request, res: Response) => {
        await this.stockService.deleteLocation(Number(req.params.id));
        res.status(204).send();
    };

    listItems = async (req: Request, res: Response) => {
        const result = StockItemsQuerySchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                result.error.issues
                    .map((issue) => issue.message)
                    .join("; ")
            );
        }

        res.json(await this.stockService.listItems(result.data.locationId));
    };

    createItem = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.createItem(req.body));
    };

    updateItem = async (req: Request, res: Response) => {
        res.json(await this.stockService.updateItem(Number(req.params.id), req.body));
    };

    deleteItem = async (req: Request, res: Response) => {
        await this.stockService.deleteItem(Number(req.params.id));
        res.status(204).send();
    };

    recordMovement = async (req: Request, res: Response) => {
        res.status(201).json(await this.stockService.recordMovement(Number(req.params.id), req.body));
    };

    getItemHistory = async (req: Request, res: Response) => {
        res.json(await this.stockService.getItemHistory(Number(req.params.id)));
    };
}
