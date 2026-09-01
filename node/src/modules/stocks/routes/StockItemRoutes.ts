import { Router } from "express";
import { CreateStockItemSchema, StockItemsQuerySchema } from "@chocosous/shared";
import StockItemController from "../controllers/StockItemController";
import { validateBody, validateQuery } from "../../core/middlewares/validate";

const StockItemRoutes = Router();
const stockItemController = new StockItemController();

StockItemRoutes.get("/", validateQuery(StockItemsQuerySchema), stockItemController.getAll);
StockItemRoutes.post("/", validateBody(CreateStockItemSchema), stockItemController.create);

export default StockItemRoutes;
