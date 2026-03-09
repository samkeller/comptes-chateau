import { Router, Request, Response } from "express";
import RecurringExpenseService from "../services/RecurringExpenseService";

const RecurringExpenseRoutes = Router();
const recurringExpenseService = new RecurringExpenseService();

RecurringExpenseRoutes.get('/', (req: Request, res: Response) => {
    recurringExpenseService.getAllRecurringExpenses().then(expenses => {
        return res.json(expenses);
    }).catch(error => {
        console.error('Error fetching recurring expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    })
})

RecurringExpenseRoutes.post('/save', (req: Request, res: Response) => {
    recurringExpenseService.save(req.body).then(expense => {
        return res.json(expense);
    }).catch(error => {
        console.error('Error saving recurring expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    })
})

export default RecurringExpenseRoutes
