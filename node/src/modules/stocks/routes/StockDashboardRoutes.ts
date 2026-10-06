import { Router } from "express";
import StockDashboardController from "../controllers/StockDashboardController";

const StockDashboardRoutes = Router();
const stockDashboardController = new StockDashboardController();

StockDashboardRoutes.get("/expiring-items", stockDashboardController.getExpiringItems);
StockDashboardRoutes.get("/overview", stockDashboardController.getOverview);
StockDashboardRoutes.get("/last-movements", stockDashboardController.getLastMovements);

export default StockDashboardRoutes;    