import { Request, Response, Router } from "express";
import BudgetService from "../services/BudgetService";
import { getAccountIdFromParams } from "../utils/accountParams";
import { IdParamSchema, validateBody, validateParams } from "../../core/middlewares/validate";
import { SaveBudgetItemSchema } from "../services/budget/BudgetDtos";

const BudgetRoutes = Router({ mergeParams: true });
const budgetService = new BudgetService();

BudgetRoutes.get("/", async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const lines = await budgetService.getActiveBudgetItems(accountId);
    res.json(lines);
});

BudgetRoutes.post("/", validateBody(SaveBudgetItemSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const created = await budgetService.create(req.body, accountId);
    res.status(201).json(created);
});

BudgetRoutes.put("/:id", validateParams(IdParamSchema), validateBody(SaveBudgetItemSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const updated = await budgetService.update(Number(req.params.id), req.body, accountId);
    res.json(updated);
});

BudgetRoutes.delete("/:id", validateParams(IdParamSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    await budgetService.delete(Number(req.params.id), accountId);
    res.status(204).send();
});

export default BudgetRoutes;
