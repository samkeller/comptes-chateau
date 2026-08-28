import { Router } from "express";
import StockController from "../controllers/StockController";
import { validateBody, validateParams, validateQuery, IdParamSchema } from "../../core/middlewares/validate";
import { CreateStockLocationSchema, UpdateStockLocationSchema } from "../dto/CreateStockLocationDto";
import { StockIntakeSchema } from "../dto/StockIntakeDto";
import { StockUnitsQuerySchema } from "../dto/StockUnitsQueryDto";
import { TakeStockUnitSchema } from "../dto/TakeStockUnitDto";

const StockRoutes = Router();
const stockController = new StockController();

StockRoutes.get("/locations", stockController.listLocations);
StockRoutes.post("/locations", validateBody(CreateStockLocationSchema), stockController.createLocation);
StockRoutes.patch("/locations/:id", validateParams(IdParamSchema), validateBody(UpdateStockLocationSchema), stockController.updateLocation);
StockRoutes.delete("/locations/:id", validateParams(IdParamSchema), stockController.deleteLocation);

StockRoutes.post("/intake", validateBody(StockIntakeSchema), stockController.intake);
StockRoutes.get("/items/:id/history", validateParams(IdParamSchema), stockController.getItemHistory);

StockRoutes.get("/units", validateQuery(StockUnitsQuerySchema), stockController.listAvailableUnits);
StockRoutes.post("/units/:id/take", validateParams(IdParamSchema), validateBody(TakeStockUnitSchema), stockController.takeUnit);

export default StockRoutes;
