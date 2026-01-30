import { Router } from "express";
import { requireUnlocked } from "./middlewares/requireUnlocked";
import OperationRoutes from './OperationControllers';
import NatureRoutes from './NatureController'
import PosteRoutes from './PosteController'

const ApiRouter = Router()

// Appliquer le middleware de sécurité pour TOUTES les routes du router
ApiRouter.use(requireUnlocked);

ApiRouter.use("/operation", OperationRoutes)
ApiRouter.use('/nature', NatureRoutes)
ApiRouter.use('/poste', PosteRoutes)

export default ApiRouter