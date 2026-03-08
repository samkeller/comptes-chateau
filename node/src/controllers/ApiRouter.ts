import { Router } from "express";
import { requireAuthenticated } from "./middlewares/requireAuthenticated";
import OperationRoutes from './OperationController';
import NatureRoutes from './NatureController'
import PosteRoutes from './PosteController'
import RecurringExpenseRoutes from './RecurringExpenseController'
import DashboardRoutes from './DashboardController'
import BudgetRoutes from './BudgetController'

const ApiRouter = Router()

// Appliquer le middleware de sécurité pour TOUTES les routes du router
ApiRouter.use(requireAuthenticated);

ApiRouter.use("/operation", OperationRoutes)
ApiRouter.use('/nature', NatureRoutes)
ApiRouter.use('/poste', PosteRoutes)
ApiRouter.use('/recurring-expense', RecurringExpenseRoutes)
ApiRouter.use('/dashboard', DashboardRoutes)
ApiRouter.use('/budget', BudgetRoutes)

export default ApiRouter