import { Router, Request, Response } from "express";
import RecurringExpenseService from "../services/RecurringExpenseService";
import { SaveRecurringExpenseSchema } from "../dto/RecurringExpenseDtos";
import { validateBody } from "../../core/middlewares/validate";
import { getAccountIdFromParams } from "../utils/accountParams";
import requireUserId from "../utils/requireUserId";

const RecurringExpenseRoutes = Router({ mergeParams: true });
const recurringExpenseService = new RecurringExpenseService();

RecurringExpenseRoutes.get('/', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const expenses = await recurringExpenseService.getAllRecurringExpenses(accountId);
    res.json(expenses);
});

RecurringExpenseRoutes.get('/:id', async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const expense = await recurringExpenseService.getById(accountId, Number(req.params.id));
    res.json(expense);
});

RecurringExpenseRoutes.post('/save', validateBody(SaveRecurringExpenseSchema), async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const creatorId = requireUserId(req);
    const expense = await recurringExpenseService.save(req.body, accountId, creatorId);
    res.json(expense);
});

export default RecurringExpenseRoutes
