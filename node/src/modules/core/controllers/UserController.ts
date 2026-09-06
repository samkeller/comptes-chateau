import { Router } from "express";
import { AvatarSchema } from "@chocosous/shared";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../entities/User";
import { toUserDto } from "../mappers/UserMapper";
import { unauthorized } from "../../../utils/AppError";
import { validateBody } from "../middlewares/validate";

const UserRoutes = Router();
const userRepo = AppDataSource.getRepository(User);

UserRoutes.get("/me", async (req, res) => {
    if (typeof req.session.userId !== "number") {
        throw unauthorized("UNAUTHORIZED", "Non authentifié");
    }

    const user = await userRepo.findOne({ where: { id: req.session.userId } });
    if (!user) {
        throw unauthorized("UNAUTHORIZED", "Utilisateur introuvable");
    }

    res.json(toUserDto(user));
});

UserRoutes.get("/", async (_req, res) => {
    const users = await userRepo.find();
    res.json(users.map(toUserDto));
});

UserRoutes.post("/avatar", validateBody(AvatarSchema), async (req, res) => {
    if (typeof req.session.userId !== "number") {
        throw unauthorized("UNAUTHORIZED", "Non authentifié");
    }

    const user = await userRepo.findOne({ where: { id: req.session.userId } });
    if (!user) {
        throw unauthorized("UNAUTHORIZED", "Utilisateur introuvable");
    }

    user.avatar = req.body.avatar;
    await userRepo.save(user);
    res.json(toUserDto(user));
});

export default UserRoutes;