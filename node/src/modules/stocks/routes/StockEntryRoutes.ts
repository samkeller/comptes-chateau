import { Router } from "express";
import { SaveStockEntrySchema } from "@chocosous/shared";
import StockEntryController from "../controllers/StockEntryController";
import { validateBody } from "../../core/middlewares/validate";

const StockEntryRoutes = Router();
const stockEntryController = new StockEntryController();

/**
 * Crée ou modifie un produit et ses lots en une transaction.
 * 201 si le produit vient d'être créé, 200 sinon ; renvoie le produit et tous ses lots.
 */
StockEntryRoutes.post("/", validateBody(SaveStockEntrySchema), stockEntryController.save);

export default StockEntryRoutes;
