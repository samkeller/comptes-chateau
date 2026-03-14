import { Router } from "express";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../entities/User";

const UserRoutes = Router();
const userRepo = AppDataSource.getRepository(User);

UserRoutes.get("/me", async (req, res) => {
    if (typeof req.session.userId !== "number") {
        return res.sendStatus(401);
    }

    try {
        const user = await userRepo.findOne({ where: { id: req.session.userId } });

        if (!user) {
            return res.sendStatus(401);
        }

        return res.json({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
        });
    } catch {
        return res.sendStatus(500);
    }
});

UserRoutes.get("/", async (req, res) => {
    try {
        const users = await userRepo.find();
        return res.json(users)
    } catch {
        return res.sendStatus(500);
    }
});

UserRoutes.post("/avatar", async (req, res) => {
    if (typeof req.session.userId !== "number") {
        return res.sendStatus(401);
    }

    try {
        const user = await userRepo.findOne({ where: { id: req.session.userId } });

        if (!user) {
            return res.sendStatus(401);
        }
        user.avatar = req.body.avatar;
        await userRepo.save(user);
        return res.json(user)
    } catch {
        return res.sendStatus(500);
    }
})


export default UserRoutes;