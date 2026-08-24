import { Request, Response } from "express";
import StockService from "../services/StockService";

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
        res.json(await this.stockService.listItems(req.query.locationId ? Number(req.query.locationId) : undefined));
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
