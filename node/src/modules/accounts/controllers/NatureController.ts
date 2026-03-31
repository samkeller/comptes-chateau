import { Router, Request, Response } from "express";
import NatureService from "../services/NatureService";
import { SaveNatureSchema } from "../services/nature/NatureDtos";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";

const NatureRoutes = Router();
const natureService = new NatureService();

NatureRoutes.get('/', async (_req: Request, res: Response) => {
    const natures = await natureService.getAll();
    res.json(natures);
});

NatureRoutes.post('/', validateBody(SaveNatureSchema), async (req: Request, res: Response) => {
    const createdNature = await natureService.create(req.body);
    res.status(201).json(createdNature);
});

NatureRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SaveNatureSchema), async (req: Request, res: Response) => {
    const updatedNature = await natureService.update(Number(req.params.id), req.body);
    res.json(updatedNature);
});

NatureRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    await natureService.delete(Number(req.params.id));
    res.status(204).send();
});

export default NatureRoutes
