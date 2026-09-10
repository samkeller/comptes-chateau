
import { BanquePostaleImportSchema, type BanquePostaleImportPayload } from "@chocosous/shared";
import { Router, type Request, type Response } from "express";
import BanquePostaleService from "../service/BanquePostaleService";
import { validateBody } from "../../core/middlewares/validate";

const BanquePostaleRoutes = Router();

const banquePostaleService = new BanquePostaleService();

BanquePostaleRoutes.post("/import", validateBody(BanquePostaleImportSchema), async (req: Request, res: Response) => {
    const body: BanquePostaleImportPayload = req.body;

    const result = await banquePostaleService.import(body);

    res.status(200).send(result);
});

export default BanquePostaleRoutes;