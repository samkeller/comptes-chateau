import { Router, Request, Response } from "express";
import { AccountLinePoste } from "../entities/AccountLinePoste";
import { AppDataSource } from "../db/dataSource";

const PosteRoutes = Router();

PosteRoutes.get('/', (req: Request, res: Response) => {
    const posteRepo = AppDataSource.getRepository(AccountLinePoste)
    posteRepo.find({
        order: { label: 'ASC' }
    }).then(postes => {
        return res.json(postes);
    })
})

export default PosteRoutes
