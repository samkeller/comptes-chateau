import { Router, Request, Response } from "express";
import PosteService from "../services/PosteService";
import { SavePosteSchema } from "../services/poste/PosteDtos";
import { validateBody, validateParams, IdParamSchema } from "../../../utils/validate";

const PosteRoutes = Router();
const posteService = new PosteService();

PosteRoutes.get('/', async (_req: Request, res: Response) => {
    const postes = await posteService.getAll();
    res.json(postes);
});

PosteRoutes.post('/', validateBody(SavePosteSchema), async (req: Request, res: Response) => {
    const createdPoste = await posteService.create(req.body);
    res.status(201).json(createdPoste);
});

PosteRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SavePosteSchema), async (req: Request, res: Response) => {
    const updatedPoste = await posteService.update(Number(req.params.id), req.body);
    res.json(updatedPoste);
});

PosteRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    await posteService.delete(Number(req.params.id));
    res.status(204).send();
});

export default PosteRoutes
