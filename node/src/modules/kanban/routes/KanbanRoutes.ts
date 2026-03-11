import { Router } from "express";
import KanbanController from "../controllers/KanbanController";

const KanbanRoutes = Router();
const kanbanController = new KanbanController();

KanbanRoutes.get("/board", kanbanController.getBoard);
KanbanRoutes.post("/task", kanbanController.saveTask);
// KanbanRoutes.patch("/tasks/:id", kanbanController.updateTask);
// KanbanRoutes.patch("/tasks/:id/move", kanbanController.moveTask);
// KanbanRoutes.patch("/tasks/:id/archive", kanbanController.archiveTask);
// KanbanRoutes.post("/tasks/:id/comments", kanbanController.addComment);
// KanbanRoutes.post("/tasks/:id/checklist", kanbanController.addChecklistItem);
// KanbanRoutes.patch("/checklist/:id", kanbanController.updateChecklistItem);

export default KanbanRoutes;
