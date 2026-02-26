import { Router } from "express";
import { requireUnlocked } from "./middlewares/requireUnlocked";
import OperationRoutes from './OperationControllers';
import NatureRoutes from './NatureController'
import PosteRoutes from './PosteController'
import RecurringExpenseRoutes from './RecurringExpenseController'
import DashboardRoutes from './DashboardController'

const ApiRouter = Router()

// Appliquer le middleware de sécurité pour TOUTES les routes du router
ApiRouter.use(requireUnlocked);

ApiRouter.use("/operation", OperationRoutes)
ApiRouter.use('/nature', NatureRoutes)
ApiRouter.use('/poste', PosteRoutes)
ApiRouter.use('/recurring-expense', RecurringExpenseRoutes)
ApiRouter.use('/dashboard', DashboardRoutes)

export default ApiRouter