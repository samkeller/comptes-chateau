import { Router } from "express";
import { StockBarcodeParamsSchema, StockItemsQuerySchema } from "@chocosous/shared";
import StockItemController from "../controllers/StockItemController";
import { IdParamSchema, validateParams, validateQuery } from "../../core/middlewares/validate";

const StockItemRoutes = Router();
const stockItemController = new StockItemController();

/** Produits et leurs lots, filtrés côté serveur (recherche, lieu, péremption, épuisés). */
StockItemRoutes.get("/", validateQuery(StockItemsQuerySchema), stockItemController.search);
StockItemRoutes.get("/lookup/:barcode", validateParams(StockBarcodeParamsSchema), stockItemController.lookup);
/** Un produit et tous ses lots, tous lieux confondus. */
StockItemRoutes.get("/:id", validateParams(IdParamSchema), stockItemController.getOne);

export default StockItemRoutes;
