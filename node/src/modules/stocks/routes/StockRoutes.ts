import { Router } from "express";
import StockController from "../controllers/StockController";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import { CreateStockItemSchema, UpdateStockItemSchema } from "../dto/CreateStockItemDto";
import { RecordStockMovementSchema } from "../dto/RecordStockMovementDto";
import StockLocationRoutes from "./StockLocationRoutes";

const StockRoutes = Router();
const stockController = new StockController();

StockRoutes.use("/locations", StockLocationRoutes);

StockRoutes.get("/items", stockController.listItems);
StockRoutes.post("/items", validateBody(CreateStockItemSchema), stockController.createItem);
StockRoutes.patch("/items/:id", validateParams(IdParamSchema), validateBody(UpdateStockItemSchema), stockController.updateItem);
StockRoutes.delete("/items/:id", validateParams(IdParamSchema), stockController.deleteItem);
StockRoutes.get("/items/:id/history", validateParams(IdParamSchema), stockController.getItemHistory);
StockRoutes.post("/items/:id/movements", validateParams(IdParamSchema), validateBody(RecordStockMovementSchema), stockController.recordMovement);

export default StockRoutes;
