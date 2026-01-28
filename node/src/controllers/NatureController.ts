import { Router, Request, Response } from "express";
import { AccountLineNature } from "../entities/AccountLineNature";
import { AppDataSource } from "../db/dataSource";

const NatureRoutes = Router();

NatureRoutes.get('/', (req: Request, res: Response) => {
    const natureRepo = AppDataSource.getRepository(AccountLineNature)
    natureRepo.find({
        order: { label: 'ASC' }
    }).then(natures => {
        return res.json(natures);
    })
})

export default NatureRoutes
