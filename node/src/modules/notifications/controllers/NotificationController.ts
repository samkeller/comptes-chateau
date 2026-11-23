import { Router, type Request, type Response } from "express";
import { DismissNotificationSchema, type DismissNotificationRequest } from "@chocosous/shared";
import requireUserId from "../../accounts/utils/requireUserId";
import { validateBody } from "../../core/middlewares/validate";
import NotificationService from "../services/NotificationService";

const NotificationRoutes = Router();

NotificationRoutes.get("/", async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    res.json(await new NotificationService().getForUser(userId));
});

NotificationRoutes.post("/dismiss", validateBody(DismissNotificationSchema), async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { key } = req.body as DismissNotificationRequest;
    await new NotificationService().dismiss(userId, key);
    res.sendStatus(204);
});

export default NotificationRoutes;
