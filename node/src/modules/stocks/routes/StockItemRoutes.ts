import { Router } from "express";
import { CreateStockItemSchema, StockBarcodeParamsSchema, StockItemsQuerySchema } from "@chocosous/shared";
import StockItemController from "../controllers/StockItemController";
import { IdParamSchema, validateBody, validateParams, validateQuery } from "../../core/middlewares/validate";

const StockItemRoutes = Router();
const stockItemController = new StockItemController();

StockItemRoutes.get("/", validateQuery(StockItemsQuerySchema), stockItemController.getAll);
StockItemRoutes.get("/lookup/:barcode", validateParams(StockBarcodeParamsSchema), stockItemController.lookup);
StockItemRoutes.post("/", validateBody(CreateStockItemSchema), stockItemController.create);
StockItemRoutes.patch("/:id", validateParams(IdParamSchema), validateBody(CreateStockItemSchema), stockItemController.patch);

export default StockItemRoutes;
