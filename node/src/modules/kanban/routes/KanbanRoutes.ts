import { Router } from "express";
import KanbanController from "../controllers/KanbanController";
import { validateBody, validateParams, IdParamSchema, CommentIdParamSchema } from "../../../utils/validate";
import { CreateKanbanTaskSchema } from "../dto/CreateKanbanTaskDto";
import { CreateKanbanCommentSchema } from "../dto/CreateKanbanCommentDto";

const KanbanRoutes = Router();
const kanbanController = new KanbanController();

KanbanRoutes.get("/board", kanbanController.getBoard);
KanbanRoutes.get("/tags", kanbanController.getAllTags);
KanbanRoutes.post("/task", validateBody(CreateKanbanTaskSchema), kanbanController.createTask);
KanbanRoutes.patch("/task/:id", validateParams(IdParamSchema), validateBody(CreateKanbanTaskSchema), kanbanController.saveTask);
KanbanRoutes.delete("/task/:id", validateParams(IdParamSchema), kanbanController.deleteTask);
KanbanRoutes.patch("/task/mark-done/:id", validateParams(IdParamSchema), kanbanController.markTaskAsDone);
KanbanRoutes.get("/task/:id/comments", validateParams(IdParamSchema), kanbanController.getTaskComments);
KanbanRoutes.post("/task/:id/comments", validateParams(IdParamSchema), validateBody(CreateKanbanCommentSchema), kanbanController.createComment);
KanbanRoutes.delete("/comment/:commentId", validateParams(CommentIdParamSchema), kanbanController.deleteComment);

export default KanbanRoutes;
