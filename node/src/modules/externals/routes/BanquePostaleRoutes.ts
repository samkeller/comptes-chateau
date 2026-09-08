import { Router } from "express";
import BanquePostaleController from "../controllers/BanquePostaleController";
import { validateBody } from "../../core/middlewares/validate";
import { BanquePostaleImportSchema } from "@chocosous/shared";

const BanquePostaleRoutes = Router();

BanquePostaleRoutes.post("/import", validateBody(BanquePostaleImportSchema), new BanquePostaleController().import);

export default BanquePostaleRoutes;
