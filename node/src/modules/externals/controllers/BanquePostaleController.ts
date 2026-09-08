
import type { BanquePostaleImportPayload } from "@chocosous/shared";
import type { Request, Response } from "express";
import BanquePostaleService from "../service/BanquePostaleService";


export default class BanquePostaleController {
    private readonly banquePostaleService = new BanquePostaleService();

    import = async (req: Request, res: Response) => {
        const body: BanquePostaleImportPayload = req.body;

        const result = await this.banquePostaleService.import(body);

        res.status(200).send(result);
    }
}