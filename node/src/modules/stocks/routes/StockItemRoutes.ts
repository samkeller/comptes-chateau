import { Router } from "express";
import StockItemController from "../controllers/StockItemController";
import { validateBody, validateQuery } from "../../core/middlewares/validate";
import { StockItemsQuerySchema } from "../dto/StockUnitsQueryDto";
import { StockItemCreateSchema } from "../dto/StockItemCreateDto";

const StockItemRoutes = Router();
const stockItemController = new StockItemController();

StockItemRoutes.get("/", validateQuery(StockItemsQuerySchema), stockItemController.getAll);
StockItemRoutes.post("/", validateBody(StockItemCreateSchema), stockItemController.create);

export default StockItemRoutes;
