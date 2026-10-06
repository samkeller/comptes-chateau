import { Router } from "express";
import StockLocationRoutes from "./StockLocationRoutes";
import StockUnitRoutes from "./StockUnitRoutes";
import StockItemRoutes from "./StockItemRoutes";
import StockDashboardRoutes from "./StockDashboardRoutes";

const StockRoutes = Router();

StockRoutes.use("/locations", StockLocationRoutes);
StockRoutes.use("/items", StockItemRoutes);
StockRoutes.use("/units", StockUnitRoutes);
StockRoutes.use("/dashboard", StockDashboardRoutes);

export default StockRoutes;
