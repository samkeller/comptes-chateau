import { Router, Request, Response } from "express";
import AccountLineCategorizationService from "../services/AccountLineCategorizationService";
import { SaveRuleSchema, searchPatternSchema } from "../dto/AccountLineRulesDto";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";
import requireUserId from "../../accounts/utils/requireUserId";

const AccountLineCategorizationRoutes = Router();
const accountLineCategorizationService = new AccountLineCategorizationService();

AccountLineCategorizationRoutes.get('/', async (_req: Request, res: Response) => {
    const rules = await accountLineCategorizationService.getAll();
    res.json(rules);
});

AccountLineCategorizationRoutes.post('/search', validateBody(searchPatternSchema), async (req: Request, res: Response) => {
    res.json(await accountLineCategorizationService.search(req.body.pattern));
});

AccountLineCategorizationRoutes.get('/unmapped', async (_req: Request, res: Response) => {
    const unmapped = await accountLineCategorizationService.getUnmapped();
    res.json(unmapped);
});

AccountLineCategorizationRoutes.post('/', validateBody(SaveRuleSchema), async (req: Request, res: Response) => {
    const connectedUserId = requireUserId(req);

    const created = await accountLineCategorizationService.create(req.body, connectedUserId);

    res.status(201).json(created);
});

AccountLineCategorizationRoutes.put('/:id', validateParams(IdParamSchema), validateBody(SaveRuleSchema), async (req: Request, res: Response) => {

    const id = Number(req.params.id)

    res.status(201).json(await accountLineCategorizationService.updateById(id, req.body));
});

AccountLineCategorizationRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    await accountLineCategorizationService.delete(Number(req.params.id));
    res.status(204).send();
});

export default AccountLineCategorizationRoutes;
