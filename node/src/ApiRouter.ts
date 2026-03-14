import { Router } from "express";
import { requireAuthenticated } from "./modules/core/middlewares/requireAuthenticated";
import OperationRoutes from './modules/accounts/controllers/OperationController';
import NatureRoutes from './modules/accounts/controllers/NatureController'
import PosteRoutes from './modules/accounts/controllers/PosteController'
import RecurringExpenseRoutes from './modules/accounts/controllers/RecurringExpenseController'
import DashboardRoutes from './modules/accounts/controllers/DashboardController'
import BudgetRoutes from './modules/accounts/controllers/BudgetController'
import KanbanRoutes from './modules/kanban/routes/KanbanRoutes'
import UserRoutes from "./modules/core/controllers/UserController";

const ApiRouter = Router()

// Appliquer le middleware de sécurité pour TOUTES les routes du router
ApiRouter.use(requireAuthenticated);

ApiRouter.use("/operation", OperationRoutes)
ApiRouter.use('/nature', NatureRoutes)
ApiRouter.use('/poste', PosteRoutes)
ApiRouter.use('/recurring-expense', RecurringExpenseRoutes)
ApiRouter.use('/dashboard', DashboardRoutes)
ApiRouter.use('/budget', BudgetRoutes)
ApiRouter.use('/kanban', KanbanRoutes)
ApiRouter.use('/users', UserRoutes)

export default ApiRouter