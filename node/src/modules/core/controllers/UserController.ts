import { Router } from "express";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../entities/User";
import { toUserDto } from "../dto/UserDto";

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

        return res.json(toUserDto(user));
    } catch {
        return res.sendStatus(500);
    }
});

UserRoutes.get("/", async (req, res) => {
    try {
        const users = await userRepo.find();
        return res.json(users.map(toUserDto))
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
        const avatar = req.body.avatar;

        // Match un pattern de nom de fichier d'avatar valide (ex: "001-john-doe.png", "123-someone.png", etc., avec un numéro à 3 chiffres suivi d'un nom et de l'extension .png)
        const AVATAR_PATTERN = /^\d{3}-[\w-]+\.png$/;

        if (typeof avatar !== "string" || !AVATAR_PATTERN.test(avatar)) {
            return res.status(400).send("Invalid avatar filename");
        }

        user.avatar = avatar;
        await userRepo.save(user);
        return res.json(toUserDto(user))
    } catch {
        return res.sendStatus(500);
    }
})


export default UserRoutes;