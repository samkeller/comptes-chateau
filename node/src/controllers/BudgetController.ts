import { Request, Response, Router } from "express";
import BudgetService from "../services/BudgetService";

const BudgetRoutes = Router();
const budgetService = new BudgetService();

BudgetRoutes.get("/", async (_req: Request, res: Response) => {
    try {
        const lines = await budgetService.getActiveBudgetItems();
        return res.json(lines);
    } catch (error) {
        console.error("Error fetching budget items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default BudgetRoutes;
