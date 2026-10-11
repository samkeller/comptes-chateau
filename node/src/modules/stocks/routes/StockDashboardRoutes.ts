import { Router } from "express";
import { StockMovementsQuerySchema } from "@chocosous/shared";
import StockDashboardController from "../controllers/StockDashboardController";
import { validateQuery } from "../../core/middlewares/validate";

const StockDashboardRoutes = Router();
const stockDashboardController = new StockDashboardController();

StockDashboardRoutes.get("/overview", stockDashboardController.getOverview);
StockDashboardRoutes.get("/last-movements", validateQuery(StockMovementsQuerySchema), stockDashboardController.getLastMovements);

export default StockDashboardRoutes;
