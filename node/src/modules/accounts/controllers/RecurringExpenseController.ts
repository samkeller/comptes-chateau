import { Router, Request, Response } from "express";
import RecurringExpenseService from "../services/RecurringExpenseService";
import { SaveRecurringExpenseSchema } from "../services/recurringExpense/RecurringExpenseDtos";
import { validateBody } from "../../../utils/validate";

const RecurringExpenseRoutes = Router();
const recurringExpenseService = new RecurringExpenseService();

RecurringExpenseRoutes.get('/', async (_req: Request, res: Response) => {
    const expenses = await recurringExpenseService.getAllRecurringExpenses();
    res.json(expenses);
});

RecurringExpenseRoutes.post('/save', validateBody(SaveRecurringExpenseSchema), async (req: Request, res: Response) => {
    const expense = await recurringExpenseService.save(req.body);
    res.json(expense);
});

export default RecurringExpenseRoutes
