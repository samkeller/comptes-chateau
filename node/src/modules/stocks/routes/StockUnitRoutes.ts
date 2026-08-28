import { Router } from "express";
import { validateParams, IdParamSchema, validateBody } from "../../core/middlewares/validate";
import StockUnitController from "../controllers/StockUnitController";
import { StockUnitIntakeSchema } from "../dto/StockUnitIntakeDto";
import { TakeStockUnitSchema } from "../dto/TakeStockUnitDto";

const StockUnitRoutes = Router();
const stockUnitController = new StockUnitController();

StockUnitRoutes.post("/intake", validateBody(StockUnitIntakeSchema ), stockUnitController.intake);
StockUnitRoutes.post("/:id/take", validateParams(IdParamSchema), validateBody(TakeStockUnitSchema), stockUnitController.takeUnit);

export default StockUnitRoutes;
