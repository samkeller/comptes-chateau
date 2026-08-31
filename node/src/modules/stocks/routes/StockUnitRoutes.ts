import { Router } from "express";
import {
    validateParams,
    IdParamSchema,
    validateBody,
    validateQuery,
} from "../../core/middlewares/validate";
import { ItemIdParamSchema } from "../dto/ItemIdDto";
import StockUnitController from "../controllers/StockUnitController";
import { StockUnitCreateSchema } from "../dto/StockUnitCreateDto";

const StockUnitRoutes = Router();
const stockUnitController = new StockUnitController();

/**
 * Récupère toutes les stock units d'un stock item.
 */
StockUnitRoutes.get(
    "/",
    validateQuery(ItemIdParamSchema),
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
