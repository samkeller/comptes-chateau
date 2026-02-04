import { Router, Request, Response } from "express";
import { RecurringExpense } from "../entities/RecurringExpense";
import { AppDataSource } from "../db/dataSource";

const RecurringExpenseRoutes = Router();

RecurringExpenseRoutes.get('/', (req: Request, res: Response) => {
    const recurringExpenseRepo = AppDataSource.getRepository(RecurringExpense)
    recurringExpenseRepo.find({
        relations: ['nature', 'poste'],
        order: { label: 'ASC' }
    }).then(expenses => {
        return res.json(expenses);
    }).catch(error => {
        console.error('Error fetching recurring expenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    })
})

RecurringExpenseRoutes.post('/save', (req: Request, res: Response) => {
    const recurringExpenseRepo = AppDataSource.getRepository(RecurringExpense)

    // TODO add validation (https://github.com/typestack/class-validator)

    recurringExpenseRepo.save(req.body).then(expense => {
        return res.json(expense);
    }).catch(error => {
        console.error('Error saving recurring expense:', error);
        res.status(500).json({ error: 'Internal server error' });
    })
})

export default RecurringExpenseRoutes
