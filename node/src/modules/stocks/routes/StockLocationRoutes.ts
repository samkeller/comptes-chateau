import { Router } from "express";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import { CreateStockLocationSchema, UpdateStockLocationSchema } from "../dto/CreateStockLocationDto";
import StockLocationController from "../controllers/StockLocationController";

const StockLocationRoutes = Router();
const stockLocationController = new StockLocationController();

StockLocationRoutes.get("", stockLocationController.listLocations);
StockLocationRoutes.post("", validateBody(CreateStockLocationSchema), stockLocationController.createLocation);
StockLocationRoutes.patch("/:id", validateParams(IdParamSchema), validateBody(UpdateStockLocationSchema), stockLocationController.updateLocation);
StockLocationRoutes.delete("/:id", validateParams(IdParamSchema), stockLocationController.deleteLocation);

export default StockLocationRoutes;
