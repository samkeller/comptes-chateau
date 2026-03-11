import { Router } from "express";
import KanbanController from "../controllers/KanbanController";

const KanbanRoutes = Router();
const kanbanController = new KanbanController();

KanbanRoutes.get("/board", kanbanController.getBoard);
KanbanRoutes.post("/task", kanbanController.createTask);
KanbanRoutes.patch("/task/:id", kanbanController.saveTask);
KanbanRoutes.delete("/task/:id", kanbanController.deleteTask);

export default KanbanRoutes;
