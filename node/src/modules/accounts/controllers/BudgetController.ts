import { Request, Response, Router } from "express";
import BudgetService from "../services/BudgetService";
import { getAccountIdFromParams } from "../utils/accountParams";

const BudgetRoutes = Router({ mergeParams: true });
const budgetService = new BudgetService();

BudgetRoutes.get("/", async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const lines = await budgetService.getActiveBudgetItems(accountId);
    res.json(lines);
});

export default BudgetRoutes;
