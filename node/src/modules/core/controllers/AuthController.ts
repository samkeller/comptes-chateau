import bcrypt from "bcrypt";
import { Router } from "express";
import { COOKIE_NAME } from "../../../index";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../entities/User";

const AuthRoutes = Router();

// Rate limiting sur les routes ouvertes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 tentatives max
  message: 'Trop de tentatives de connexion, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

AuthRoutes.use(loginLimiter);

AuthRoutes.post("/login", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!username || !password) {
    return res.sendStatus(400);
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo
      .createQueryBuilder("ua")
      .addSelect("ua.passwordHash")
      .where("LOWER(ua.username) = :username", { username })
      .getOne();

    if (!user) {
      return res.sendStatus(401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.sendStatus(401);

    req.session.userId = user.id;
    req.session.username = user.username;

    return res.json({
      id: user.id,
      username: user.username,
    });
  } catch {
    return res.sendStatus(500);
  }
});

AuthRoutes.get("/me", async (req, res) => {
  if (typeof req.session.userId !== "number") {
    return res.sendStatus(401);
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.session.userId } });

    if (!user) {
      return res.sendStatus(401);
    }

    return res.json({
      id: user.id,
      username: user.username,
    });
  } catch {
    return res.sendStatus(500);
  }
});

AuthRoutes.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.sendStatus(500);

    res.clearCookie(COOKIE_NAME); // nom du cookie de session
    res.sendStatus(204);
  });
});


export default AuthRoutes;