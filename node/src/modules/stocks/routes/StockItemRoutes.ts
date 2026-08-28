import { Router } from "express";
import StockItemController from "../controllers/StockItemController";
import { validateQuery } from "../../core/middlewares/validate";
import { StockItemsQuerySchema } from "../dto/StockUnitsQueryDto";

const StockItemRoutes = Router();
const stockItemController = new StockItemController();

StockItemRoutes.get("/", validateQuery(StockItemsQuerySchema), stockItemController.getAll);

export default StockItemRoutes;
