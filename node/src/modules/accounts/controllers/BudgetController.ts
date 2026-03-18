import { Request, Response, Router } from "express";
import BudgetService from "../services/BudgetService";

const BudgetRoutes = Router();
const budgetService = new BudgetService();

BudgetRoutes.get("/", async (_req: Request, res: Response) => {
    const lines = await budgetService.getActiveBudgetItems();
    res.json(lines);
});

export default BudgetRoutes;
