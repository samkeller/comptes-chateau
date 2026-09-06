import { Router } from "express";
import StockLocationRoutes from "./StockLocationRoutes";
import StockUnitRoutes from "./StockUnitRoutes";
import StockItemRoutes from "./StockItemRoutes";

const StockRoutes = Router();

StockRoutes.use("/locations", StockLocationRoutes);
StockRoutes.use("/items", StockItemRoutes);
StockRoutes.use("/units", StockUnitRoutes);

export default StockRoutes;
