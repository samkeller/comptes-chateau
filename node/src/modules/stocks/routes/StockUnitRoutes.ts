import { Router } from "express";
import { validateParams, IdParamSchema } from "../../core/middlewares/validate";
import StockUnitController from "../controllers/StockUnitController";

const StockUnitRoutes = Router();
const stockUnitController = new StockUnitController();

/**
 * Retire un exemplaire saisi par erreur (mouvement `DELETE`).
 */
StockUnitRoutes.delete(
    "/:id",
    validateParams(IdParamSchema),
    stockUnitController.delete
);

/**
 * Coche (consomme) un exemplaire (mouvement `OUT`). Répond 204 sans corps.
 */
StockUnitRoutes.post(
    "/:id/take",
    validateParams(IdParamSchema),
    stockUnitController.takeUnit
);

export default StockUnitRoutes;
