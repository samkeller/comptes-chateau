import { Router } from "express";
import StockController from "../controllers/StockController";
import { validateBody, validateParams, validateQuery, IdParamSchema } from "../../core/middlewares/validate";
import { CreateStockLocationSchema } from "../dto/CreateStockLocationDto";
import { CreateStockItemSchema, StockItemsQuerySchema, UpdateStockItemSchema } from "../dto/CreateStockItemDto";
import { RecordStockMovementSchema } from "../dto/RecordStockMovementDto";

const StockRoutes = Router();
const stockController = new StockController();

StockRoutes.get("/locations", stockController.listLocations);
StockRoutes.post("/locations", validateBody(CreateStockLocationSchema), stockController.createLocation);
StockRoutes.patch("/locations/:id", validateParams(IdParamSchema), validateBody(CreateStockLocationSchema), stockController.updateLocation);
StockRoutes.delete("/locations/:id", validateParams(IdParamSchema), stockController.deleteLocation);

StockRoutes.get("/items", validateQuery(StockItemsQuerySchema), stockController.listItems);
StockRoutes.post("/items", validateBody(CreateStockItemSchema), stockController.createItem);
StockRoutes.patch("/items/:id", validateParams(IdParamSchema), validateBody(UpdateStockItemSchema), stockController.updateItem);
StockRoutes.delete("/items/:id", validateParams(IdParamSchema), stockController.deleteItem);
StockRoutes.get("/items/:id/history", validateParams(IdParamSchema), stockController.getItemHistory);
StockRoutes.post("/items/:id/movements", validateParams(IdParamSchema), validateBody(RecordStockMovementSchema), stockController.recordMovement);

export default StockRoutes;
