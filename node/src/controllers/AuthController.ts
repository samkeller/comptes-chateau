import bcrypt from "bcrypt";
import { Router } from "express";
import { COOKIE_NAME } from "..";
import rateLimit from "express-rate-limit";

const masterPassword = process.env.MASTER_PASSWORD;

if (!masterPassword) {
  throw new Error("MASTER_PASSWORD environment variable is not set");
}

// Hash au démarrage pour comparaison sécurisée
const masterHash = bcrypt.hashSync(masterPassword, 10);

const AuthRoutes = Router();

// Rate limiting sur les routes ouvertes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

AuthRoutes.use(loginLimiter);

AuthRoutes.post("/login", async (req, res) => {
  const { password } = req.body;

  if (!password) return res.sendStatus(400);

  try {
    const isValid = await bcrypt.compare(password, masterHash);
    if (!isValid) return res.sendStatus(401);

    req.session.unlocked = true;
    res.json({ ok: true });
  } catch (error) {
    res.sendStatus(500);
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