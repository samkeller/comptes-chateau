import { Router, Request, Response } from "express";
import PosteService from "../services/PosteService";
import { SavePosteSchema } from "@chocosous/shared";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import { getAccountIdFromParams } from "../utils/accountParams";

const PosteRoutes = Router({ mergeParams: true });
const posteService = new PosteService();

PosteRoutes.get('/', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const postes = await posteService.getAll(accountId);
    res.json(postes);
});

PosteRoutes.post('/', validateBody(SavePosteSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const createdPoste = await posteService.create(req.body, accountId);
    res.status(201).json(createdPoste);
});

PosteRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SavePosteSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const updatedPoste = await posteService.update(Number(req.params.id), req.body, accountId);
    res.json(updatedPoste);
});

PosteRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    await posteService.delete(Number(req.params.id), accountId);
    res.status(204).send();
});

export default PosteRoutes
