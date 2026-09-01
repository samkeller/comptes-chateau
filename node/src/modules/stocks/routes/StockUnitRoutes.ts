import { Router } from "express";
import {
    validateParams,
    IdParamSchema,
    validateBody,
    validateQuery,
} from "../../core/middlewares/validate";
import { StockUnitCreateSchema, StockUnitsQuerySchema } from "@chocosous/shared";
import StockUnitController from "../controllers/StockUnitController";

const StockUnitRoutes = Router();
const stockUnitController = new StockUnitController();

/**
 * Récupère toutes les stock units d'un stock item.
 */
StockUnitRoutes.get(
    "/",
    validateQuery(StockUnitsQuerySchema),
    stockUnitController.getAll
);

/**
 * Crée une nouvelle stock unit.
 */
StockUnitRoutes.post(
    "/",
    validateBody(StockUnitCreateSchema),
    stockUnitController.create
);

/**
 * Met à jour une stock unit existante.
 */
StockUnitRoutes.patch(
    "/:id",
    validateParams(IdParamSchema),
    validateBody(StockUnitCreateSchema),
    stockUnitController.update
);

/**
 * Supprime une stock unit existante.
 */
StockUnitRoutes.delete(
    "/:id",
    validateParams(IdParamSchema),
    stockUnitController.delete
);

/**
 * Prélève une quantité d'une stock unit.
 */
StockUnitRoutes.post(
    "/:id/take",
    validateParams(IdParamSchema),
    stockUnitController.takeUnit
);

export default StockUnitRoutes;
