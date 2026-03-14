import { Router } from "express";
import KanbanController from "../controllers/KanbanController";

const KanbanRoutes = Router();
const kanbanController = new KanbanController();

KanbanRoutes.get("/board", kanbanController.getBoard);
KanbanRoutes.get("/tags", kanbanController.getAllTags);
KanbanRoutes.post("/task", kanbanController.createTask);
KanbanRoutes.patch("/task/:id", kanbanController.saveTask);
KanbanRoutes.delete("/task/:id", kanbanController.deleteTask);
KanbanRoutes.patch("/task/mark-done/:id", kanbanController.markTaskAsDone);

export default KanbanRoutes;
