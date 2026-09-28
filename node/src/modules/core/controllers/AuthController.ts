import bcrypt from "bcrypt";
import { Router } from "express";
import { LoginSchema, type LoginResponse } from "@chocosous/shared";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../entities/User";
import { unauthorized } from "../../../utils/AppError";
import { validateBody } from "../middlewares/validate";
import { getSessionDurationMs, SESSION_COOKIE_NAME } from "../../../config/session";

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

AuthRoutes.post("/login", validateBody(LoginSchema), async (req, res) => {
  const { username, password, rememberDevice } = req.body;

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo
    .createQueryBuilder("ua")
    .addSelect("ua.passwordHash")
    .where("LOWER(ua.username) = :username", { username })
    .getOne();

  if (!user) {
    throw unauthorized("AUTH_INVALID_CREDENTIALS", "Identifiants invalides");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw unauthorized("AUTH_INVALID_CREDENTIALS", "Identifiants invalides");

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.cookie.maxAge = getSessionDurationMs(rememberDevice);

  const response: LoginResponse = {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
  };

  res.json(response);
});


AuthRoutes.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.sendStatus(500);

    res.clearCookie(SESSION_COOKIE_NAME);
    res.sendStatus(204);
  });
});


export default AuthRoutes;