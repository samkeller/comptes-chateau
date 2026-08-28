import { Router } from "express";
import StockUnitController from "../controllers/StockUnitController";
import { StockItemsQuerySchema } from "../dto/StockUnitsQueryDto";
import StockLocationRoutes from "./StockLocationRoutes";
import StockUnitRoutes from "./StockUnitRoutes";
import StockItemRoutes from "./StockItemRoutes";

const StockRoutes = Router();

StockRoutes.use("/locations", StockLocationRoutes);
StockRoutes.use("/items", StockItemRoutes);
StockRoutes.use("/units", StockUnitRoutes);

export default StockRoutes;
