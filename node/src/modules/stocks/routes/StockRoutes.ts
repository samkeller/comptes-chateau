import { Router } from "express";
import {
	CreateStockItemSchema,
	CreateStockLocationSchema,
	RecordStockMovementSchema,
	UpdateStockItemSchema,
	UpdateStockLocationSchema,
} from "@chocosous/shared";
import StockController from "../controllers/StockController";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";

const StockRoutes = Router();
const stockController = new StockController();

StockRoutes.get("/locations", stockController.listLocations);
StockRoutes.post("/locations", validateBody(CreateStockLocationSchema), stockController.createLocation);
StockRoutes.patch("/locations/:id", validateParams(IdParamSchema), validateBody(UpdateStockLocationSchema), stockController.updateLocation);
StockRoutes.delete("/locations/:id", validateParams(IdParamSchema), stockController.deleteLocation);

StockRoutes.get("/items", stockController.listItems);
StockRoutes.post("/items", validateBody(CreateStockItemSchema), stockController.createItem);
StockRoutes.patch("/items/:id", validateParams(IdParamSchema), validateBody(UpdateStockItemSchema), stockController.updateItem);
StockRoutes.delete("/items/:id", validateParams(IdParamSchema), stockController.deleteItem);
StockRoutes.get("/items/:id/history", validateParams(IdParamSchema), stockController.getItemHistory);
StockRoutes.post("/items/:id/movements", validateParams(IdParamSchema), validateBody(RecordStockMovementSchema), stockController.recordMovement);

export default StockRoutes;
