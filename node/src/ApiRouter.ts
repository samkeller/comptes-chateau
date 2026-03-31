import { Router } from "express";
import { requireAuthenticated } from "./modules/core/middlewares/requireAuthenticated";
import AccountRoutes from './modules/accounts/controllers/AccountController';
import AccountScopedRoutes from './modules/accounts/controllers/AccountScopedRoutes';
import NatureRoutes from './modules/accounts/controllers/NatureController'
import KanbanRoutes from './modules/kanban/routes/KanbanRoutes'
import UserRoutes from "./modules/core/controllers/UserController";

const ApiRouter = Router()

// Appliquer le middleware de sécurité pour TOUTES les routes du router
ApiRouter.use(requireAuthenticated);

ApiRouter.use('/accounts', AccountRoutes)
ApiRouter.use('/accounts/:accountId', AccountScopedRoutes)

ApiRouter.use('/nature', NatureRoutes)
ApiRouter.use('/kanban', KanbanRoutes)
ApiRouter.use('/users', UserRoutes)

export default ApiRouter