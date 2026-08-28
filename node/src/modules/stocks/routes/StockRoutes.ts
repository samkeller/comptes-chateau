import { Router } from "express";
import StockController from "../controllers/StockController";
import { validateBody, validateParams, validateQuery, IdParamSchema } from "../../core/middlewares/validate";
import { StockIntakeSchema } from "../dto/StockIntakeDto";
import { StockUnitsQuerySchema } from "../dto/StockUnitsQueryDto";
import { TakeStockUnitSchema } from "../dto/TakeStockUnitDto";
import StockLocationRoutes from "./StockLocationRoutes";

const StockRoutes = Router();
const stockController = new StockController();

StockRoutes.use("/locations", StockLocationRoutes);

StockRoutes.post("/intake", validateBody(StockIntakeSchema), stockController.intake);
StockRoutes.get("/units", validateQuery(StockUnitsQuerySchema), stockController.listAvailableUnits);
StockRoutes.post("/units/:id/take", validateParams(IdParamSchema), validateBody(TakeStockUnitSchema), stockController.takeUnit);

export default StockRoutes;
