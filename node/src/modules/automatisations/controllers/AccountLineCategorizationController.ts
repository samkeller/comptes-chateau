import { Router, Request, Response } from "express";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../../core/entities/User";
import AccountLineCategorizationService from "../services/AccountLineCategorizationService";
import { SaveRuleSchema } from "../services/rules/AccountLineRulesDto";
import { validateBody, validateParams, IdParamSchema } from "../../core/middlewares/validate";

const AccountLineCategorizationRoutes = Router();
const accountLineCategorizationService = new AccountLineCategorizationService();
const XP_REWARD = 10;

AccountLineCategorizationRoutes.get('/', async (_req: Request, res: Response) => {
    const rules = await accountLineCategorizationService.getAll();
    res.json(rules);
});

AccountLineCategorizationRoutes.get('/unmapped', async (_req: Request, res: Response) => {
    const unmapped = await accountLineCategorizationService.getUnmapped();
    res.json(unmapped);
});

AccountLineCategorizationRoutes.post('/', validateBody(SaveRuleSchema), async (req: Request, res: Response) => {
    const created = await accountLineCategorizationService.create(req.body);

    if (typeof req.session.userId === "number") {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: req.session.userId } });
        if (user) {
            user.totalXp += XP_REWARD;
            await userRepo.save(user);
        }
    }

    res.status(201).json(created);
});

AccountLineCategorizationRoutes.put('/:id', validateBody(SaveRuleSchema), async (req: Request, res: Response) => {

    const id = Number(req.params.id)

    res.status(201).json(await accountLineCategorizationService.updateById(id, req.body));
});

AccountLineCategorizationRoutes.delete('/:id', validateParams(IdParamSchema), async (req: Request, res: Response) => {
    await accountLineCategorizationService.delete(Number(req.params.id));
    res.status(204).send();
});

export default AccountLineCategorizationRoutes;
